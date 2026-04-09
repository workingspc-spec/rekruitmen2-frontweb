// src/components/Portal.jsx
import { createPortal } from 'react-dom'

/**
 * Portal merender children langsung ke document.body,
 * sehingga position:fixed selalu relatif ke viewport —
 * tidak terpengaruh oleh transform/opacity/overflow ancestor manapun.
 */
export function Portal({ children }) {
  return createPortal(children, document.body)
}