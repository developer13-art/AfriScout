import { Dialog, type DialogProps } from "./Dialog";

export type ModalProps = DialogProps;

export function Modal(props: ModalProps) {
  return <Dialog {...props} />;
}