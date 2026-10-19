'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const [returnFocus] = useState(() =>
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  return (
    <Dialog.Root
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocus?.focus();
          }}
        >
          <div className="section-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close aria-label="Close dialog" className="icon-button">
              <X size={20} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="muted">
            Changes are saved in this browser only. Use fictional details.
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
