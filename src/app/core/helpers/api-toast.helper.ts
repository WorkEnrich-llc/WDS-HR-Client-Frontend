import { ToasterMessageService } from '../services/tostermessage/tostermessage.service';

export class ApiToastHelper {

    /**
     * Handle API response with automatic toast notifications
     * @param response - The API response object
     * @param toasterService - The ToasterMessageService instance
     * @param successMessage - Optional custom success message
     */
    static handleApiResponse(
        response: any,
        toasterService: ToasterMessageService,
        successMessage?: string
    ): void {
        if (response.status >= 200 && response.status < 300) {
            const message = successMessage ||
                response.message ||
                response.data?.message ||
                'Operation completed successfully';
            toasterService.showSuccess(message);
        }
    }

    /**
     * Handle API error with automatic toast notifications
     * @param error - The error object
     * @param toasterService - The ToasterMessageService instance
     * @param customErrorMessage - Optional custom error message
     */
    static handleApiError(
        error: any,
        toasterService: ToasterMessageService,
        customErrorMessage?: string
    ): void {
        const errorMessage = customErrorMessage ||
            error?.error?.message ||
            error?.error?.details ||
            error?.message ||
            'An error occurred';

        toasterService.showError(errorMessage);
    }

    /**
     * Show loading toast for long operations
     * @param toasterService - The ToasterMessageService instance
     * @param message - Loading message
     */
    static showLoadingToast(
        toasterService: ToasterMessageService,
        message: string = 'Processing...'
    ): void {
        toasterService.showInfo(message, 'Please wait');
    }

    /**
     * Show validation error toast
     * @param toasterService - The ToasterMessageService instance
     * @param message - Validation error message
     */
    static showValidationError(
        toasterService: ToasterMessageService,
        message: string = 'Please fill all required fields correctly'
    ): void {
        toasterService.showWarning(message, 'Validation Error');
    }
}
