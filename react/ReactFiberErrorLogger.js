
import { showErrorDialog } from './ReactFiberErrorDialog';

export function logCapturedError(capturedError) {
	const logError = showErrorDialog(capturedError);

	// Allow injected showErrorDialog() to prevent default console.error logging.
	// This enables renderers like ReactNative to better manage redbox behavior.
	if (logError === false) {
		return;
	}

	const error = capturedError.error;

	// In production, we print the error directly.
	// This will include the message, the JS stack, and anything the browser wants to show.
	// We pass the error object instead of custom message so that the browser displays the error natively.
	console.error(error);
}
