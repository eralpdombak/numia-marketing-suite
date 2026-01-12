// Clean toast API that dispatches custom events
export const toast = {
  success: (message: string) => {
    window.dispatchEvent(new CustomEvent('notification', {
      detail: { message, type: 'success' }
    }));
  },
  error: (message: string) => {
    window.dispatchEvent(new CustomEvent('notification', {
      detail: { message, type: 'error' }
    }));
  },
  info: (message: string) => {
    window.dispatchEvent(new CustomEvent('notification', {
      detail: { message, type: 'info' }
    }));
  },
  message: (message: string) => {
    window.dispatchEvent(new CustomEvent('notification', {
      detail: { message, type: 'info' }
    }));
  },
};

// Empty toaster component for backwards compatibility
const Toaster = () => null;

export { Toaster };
