import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type SessionStatus = 'active' | 'ended' | 'paused';
type PermissionStatus = 'pending' | 'granted' | 'denied' | 'expired';

export interface CourtSession {
  id: string;
  case_id: string;
  judge_id: string;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermissionRequest {
  id: string;
  session_id: string;
  case_id: string;
  requester_id: string;
  status: PermissionStatus;
  requested_at: string;
  responded_at: string | null;
  responded_by: string | null;
  requester_name?: string;
}

export const useCourtSession = (caseId: string) => {
  const { profile } = useAuth();
  const [activeSession, setActiveSession] = useState<CourtSession | null>(null);
  const [permissionRequests, setPermissionRequests] = useState<PermissionRequest[]>([]);
  const [myPermission, setMyPermission] = useState<PermissionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isJudge = profile?.role_category === 'judiciary';
  const canUpload = myPermission?.status === 'granted' || isJudge;

  // Fetch active session
  const fetchSession = useCallback(async () => {
    if (!caseId) return;

    const { data, error } = await supabase
      .from('session_logs')
      .select('*')
      .eq('case_id', caseId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching session:', error);
      return;
    }

    // Type assertion needed since supabase types may not include new tables yet
    setActiveSession(data as CourtSession | null);
    return data as CourtSession | null;
  }, [caseId]);

  // Fetch permission requests
  const fetchPermissions = useCallback(async (sessionId?: string) => {
    if (!caseId) return;

    let query = supabase
      .from('permission_requests')
      .select('*')
      .eq('case_id', caseId)
      .order('requested_at', { ascending: false });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching permissions:', error);
      return;
    }

    // Fetch requester names
    const requesterIds = [...new Set((data || []).map(p => p.requester_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', requesterIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

    const withNames = (data || []).map(p => ({
      ...p,
      requester_name: profileMap.get(p.requester_id) || 'Unknown',
    })) as PermissionRequest[];

    setPermissionRequests(withNames);

    // Find my permission
    if (profile?.id) {
      const mine = withNames.find(
        p => p.requester_id === profile.id && 
        (p.status === 'pending' || p.status === 'granted')
      );
      setMyPermission(mine || null);
    }
  }, [caseId, profile?.id]);

  // Start session (Judge only)
  const startSession = async () => {
    if (!isJudge || !profile?.id || !caseId) {
      toast.error('Only judges can start a court session');
      return null;
    }

    // Check for existing active session
    if (activeSession) {
      toast.error('A session is already active');
      return null;
    }

    const { data, error } = await supabase
      .from('session_logs')
      .insert({
        case_id: caseId,
        judge_id: profile.id,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
      return null;
    }

    // Log to case diary
    await supabase.from('case_diary').insert({
      case_id: caseId,
      action: 'SESSION_START',
      actor_id: profile.id,
      details: { session_id: data.id },
    });

    toast.success('Court session started');
    setActiveSession(data as CourtSession);
    return data as CourtSession;
  };

  // End session (Judge only)
  const endSession = async (notes?: string) => {
    if (!isJudge || !activeSession || !profile?.id) {
      toast.error('Cannot end session');
      return false;
    }

    const { error } = await supabase
      .from('session_logs')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        notes: notes || activeSession.notes,
      })
      .eq('id', activeSession.id);

    if (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
      return false;
    }

    // Expire all pending permissions
    await supabase
      .from('permission_requests')
      .update({ status: 'expired' })
      .eq('session_id', activeSession.id)
      .eq('status', 'pending');

    // Log to case diary with notes
    await supabase.from('case_diary').insert({
      case_id: caseId,
      action: 'SESSION_END',
      actor_id: profile.id,
      details: { 
        session_id: activeSession.id,
        duration_minutes: Math.round(
          (Date.now() - new Date(activeSession.started_at).getTime()) / 60000
        ),
        notes_summary: notes || activeSession.notes || null,
      },
    });

    toast.success('Court session ended');
    setActiveSession(null);
    setMyPermission(null);
    return true;
  };

  // Update session notes
  const updateNotes = async (notes: string) => {
    if (!activeSession) return false;

    const { error } = await supabase
      .from('session_logs')
      .update({ notes })
      .eq('id', activeSession.id);

    if (error) {
      console.error('Error updating notes:', error);
      return false;
    }

    setActiveSession(prev => prev ? { ...prev, notes } : null);
    return true;
  };

  // Request upload permission (Lawyer)
  const requestPermission = async () => {
    if (!activeSession || !profile?.id) {
      toast.error('No active session');
      return null;
    }

    // Check for existing pending request
    const existing = permissionRequests.find(
      p => p.requester_id === profile.id && 
      p.session_id === activeSession.id &&
      (p.status === 'pending' || p.status === 'granted')
    );

    if (existing) {
      toast.info(existing.status === 'granted' ? 'Permission already granted' : 'Request pending');
      return existing;
    }

    const { data, error } = await supabase
      .from('permission_requests')
      .insert({
        session_id: activeSession.id,
        case_id: caseId,
        requester_id: profile.id,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error requesting permission:', error);
      toast.error('Failed to request permission');
      return null;
    }

    toast.success('Permission request sent to Judge');
    await fetchPermissions(activeSession.id);
    return data as PermissionRequest;
  };

  // Respond to permission request (Judge only)
  const respondToPermission = async (requestId: string, grant: boolean) => {
    if (!isJudge || !profile?.id) {
      toast.error('Only judges can respond to permission requests');
      return false;
    }

    const { error } = await supabase
      .from('permission_requests')
      .update({
        status: grant ? 'granted' : 'denied',
        responded_at: new Date().toISOString(),
        responded_by: profile.id,
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error responding to permission:', error);
      toast.error('Failed to update permission');
      return false;
    }

    toast.success(grant ? 'Permission granted' : 'Permission denied');
    await fetchPermissions(activeSession?.id);
    return true;
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const session = await fetchSession();
      if (session) {
        await fetchPermissions(session.id);
      }
      setIsLoading(false);
    };
    loadData();
  }, [fetchSession, fetchPermissions]);

  // Real-time subscription for session updates
  useEffect(() => {
    if (!caseId) return;

    const channel = supabase
      .channel(`session-${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_logs',
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          console.log('Session update:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const session = payload.new as CourtSession;
            if (session.status === 'active') {
              setActiveSession(session);
              fetchPermissions(session.id);
              if (payload.eventType === 'INSERT' && !isJudge) {
                toast.info('Court session has started', { 
                  description: 'The Judge has opened the session' 
                });
              }
            } else if (session.status === 'ended') {
              setActiveSession(null);
              setMyPermission(null);
              if (!isJudge) {
                toast.info('Court session has ended');
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'permission_requests',
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          console.log('Permission update:', payload);
          fetchPermissions(activeSession?.id);
          
          // Notify about permission changes
          if (payload.eventType === 'INSERT' && isJudge) {
            toast.info('New permission request received');
          } else if (payload.eventType === 'UPDATE') {
            const req = payload.new as PermissionRequest;
            if (req.requester_id === profile?.id) {
              if (req.status === 'granted') {
                toast.success('Permission granted! You can now upload evidence');
              } else if (req.status === 'denied') {
                toast.error('Permission denied by the Judge');
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId, isJudge, profile?.id, activeSession?.id, fetchPermissions]);

  return {
    activeSession,
    permissionRequests,
    myPermission,
    isLoading,
    isJudge,
    canUpload,
    isSessionActive: !!activeSession,
    startSession,
    endSession,
    updateNotes,
    requestPermission,
    respondToPermission,
    refreshSession: fetchSession,
    refreshPermissions: () => fetchPermissions(activeSession?.id),
  };
};
