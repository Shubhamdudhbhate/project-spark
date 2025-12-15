import { motion } from "framer-motion";
import { ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useState } from "react";

const evidenceData = [
  {
    id: "CASE-2024-001",
    fileName: "forensic_report.pdf",
    officer: "Officer R. Sharma",
    timestamp: "2024-01-15 14:32:05",
    hash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    status: "secured",
  },
  {
    id: "CASE-2024-002",
    fileName: "witness_statement.docx",
    officer: "Officer A. Patel",
    timestamp: "2024-01-15 11:18:42",
    hash: "0x3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d",
    status: "pending",
  },
  {
    id: "CASE-2024-003",
    fileName: "cctv_footage.mp4",
    officer: "Officer M. Singh",
    timestamp: "2024-01-14 09:45:21",
    hash: "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    status: "secured",
  },
  {
    id: "CASE-2024-004",
    fileName: "crime_scene_photo.jpg",
    officer: "Officer P. Kumar",
    timestamp: "2024-01-14 08:22:11",
    hash: "0xfcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9",
    status: "tampered",
  },
  {
    id: "CASE-2024-005",
    fileName: "lab_analysis.pdf",
    officer: "Officer S. Gupta",
    timestamp: "2024-01-13 16:55:33",
    hash: "0xd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
    status: "secured",
  },
];

const statusConfig = {
  secured: { label: "Secured", className: "badge-secured" },
  pending: { label: "Pending", className: "badge-pending" },
  tampered: { label: "Tampered", className: "badge-tampered" },
};

export const EvidenceTable = () => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-6 border-b border-white/5">
        <h3 className="text-lg font-semibold">Evidence Vault</h3>
        <p className="text-sm text-muted-foreground mt-1">
          All secured evidence files with blockchain verification
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Case ID</TableHead>
              <TableHead className="text-muted-foreground font-medium">File Name</TableHead>
              <TableHead className="text-muted-foreground font-medium">Uploaded By</TableHead>
              <TableHead className="text-muted-foreground font-medium">Timestamp</TableHead>
              <TableHead className="text-muted-foreground font-medium">Blockchain Hash</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evidenceData.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                className="border-white/5 hover:bg-secondary/30 transition-colors"
              >
                <TableCell className="font-medium text-primary">{item.id}</TableCell>
                <TableCell>{item.fileName}</TableCell>
                <TableCell className="text-muted-foreground">{item.officer}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {item.timestamp}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs text-primary/80 bg-primary/5 px-2 py-1 rounded">
                      {truncateHash(item.hash)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => copyHash(item.hash)}
                    >
                      {copiedHash === item.hash ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      statusConfig[item.status as keyof typeof statusConfig].className
                    )}
                  >
                    {statusConfig[item.status as keyof typeof statusConfig].label}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};
