const PARENT_GATE_SESSION_KEY = 'bobby_parent_gate_ack';

const getParentGateDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const hasParentGateAcknowledgement = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.sessionStorage.getItem(PARENT_GATE_SESSION_KEY) ===
    getParentGateDateKey()
  );
};

const setParentGateAcknowledgement = (): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(
    PARENT_GATE_SESSION_KEY,
    getParentGateDateKey()
  );
};

export {
  PARENT_GATE_SESSION_KEY,
  getParentGateDateKey,
  hasParentGateAcknowledgement,
  setParentGateAcknowledgement,
};
