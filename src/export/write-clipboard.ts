type ElectronClipboardModule = {
  clipboard?: {
    writeText(text: string): void;
  };
};

type WindowWithNativeRequire = Window & {
  require?: (moduleName: string) => ElectronClipboardModule;
};

function copyWithElectron(text: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const nativeRequire = (window as WindowWithNativeRequire).require;
    const clipboard = nativeRequire?.('electron').clipboard;

    if (!clipboard) {
      return false;
    }

    clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function copyWithExecCommand(text: string): boolean {
  if (
    typeof document === 'undefined' ||
    typeof document.execCommand !== 'function'
  ) {
    return false;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);

  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } finally {
    textarea.remove();
  }
}

export async function writeClipboardText(text: string): Promise<void> {
  let clipboardError: unknown;

  if (copyWithElectron(text)) {
    return;
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch (error) {
    clipboardError = error;
  }

  if (copyWithExecCommand(text)) {
    return;
  }

  if (clipboardError) {
    throw clipboardError;
  }

  throw new DOMException('Clipboard access was denied.', 'NotAllowedError');
}
