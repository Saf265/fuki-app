import { useEffect, useState } from "react";

/**
 * Hook pour détecter si un dropdown doit s'ouvrir vers le haut ou le bas
 * @param {boolean} isOpen - Si le dropdown est ouvert
 * @param {React.RefObject} ref - Référence au conteneur du dropdown
 * @param {number} dropdownHeight - Hauteur approximative du dropdown (défaut: 250px)
 * @returns {boolean} - true si le dropdown doit s'ouvrir vers le haut
 */
export function useDropdownPosition(isOpen, ref, dropdownHeight = 250) {
  const [openUpward, setOpenUpward] = useState(false);

  useEffect(() => {
    if (!isOpen || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Si pas assez d'espace en bas mais plus d'espace en haut, ouvrir vers le haut
    setOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
  }, [isOpen, dropdownHeight]);

  return openUpward;
}
