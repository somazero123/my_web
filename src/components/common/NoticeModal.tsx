import { useEffect } from "react";
import Modal from "@/components/ui/Modal";

type Props = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  autoCloseMs?: number;
};

export default function NoticeModal({ open, title, description, onClose, autoCloseMs = 2000 }: Props) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose(), autoCloseMs);
    return () => clearTimeout(t);
  }, [open, autoCloseMs, onClose]);

  return <Modal open={open} title={title} description={description} onClose={onClose} />;
}

