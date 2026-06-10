import { toBlob, toPng } from 'html-to-image';
import { api } from '@/lib/api';

const EXPORT_SCALE = 2;

export const exportChartAsImage = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element not found: ${elementId}`);
        return;
    }

    try {
        const dataUrl = await toPng(element, {
            cacheBust: true,
            backgroundColor: '#ffffff',
            pixelRatio: EXPORT_SCALE,
        });
        const link = document.createElement('a');
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Failed to export chart:', err);
    }
};

export const exportAllCharts = async (chartIds: string[], zipFilename: string) => {
    try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (const id of chartIds) {
            const element = document.getElementById(id);
            if (element) {
                const blob = await toBlob(element, {
                    cacheBust: true,
                    backgroundColor: '#ffffff',
                    pixelRatio: EXPORT_SCALE,
                });
                if (blob) {
                    zip.file(`${id}.png`, blob);
                }
            }
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${zipFilename}_${new Date().toISOString().split('T')[0]}.zip`;
        link.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Failed to export all charts:', err);
    }
};

export const exportTimeEntries = async (
    params: Record<string, any>,
    format: 'csv' | 'pdf',
    token?: string | null,
) => {
    try {
        const sanitizedParams = Object.fromEntries(
            Object.entries({ ...params, format } as Record<string, any>).filter(([, value]) => value !== undefined && value !== null && value !== '')
        );

        const headers: Record<string, string> = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const res = await api.get('/time-entries/export', {
            params: sanitizedParams,
            responseType: 'blob',
            headers: Object.keys(headers).length > 0 ? headers : undefined,
        });
        const blob = res.data;
        const filename = `time-entries_${new Date().toISOString().split('T')[0]}.${format}`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Failed to export time entries:', err);

        let errorMessage = 'Export failed; see console for details';
        if (typeof window !== 'undefined' && err && typeof err === 'object' && 'response' in err) {
            try {
                const responseBlob = (err as any).response?.data;
                if (responseBlob instanceof Blob) {
                    const text = await responseBlob.text();
                    const parsed = JSON.parse(text);
                    if (parsed?.message) {
                        errorMessage = Array.isArray(parsed.message)
                            ? parsed.message.join(', ')
                            : String(parsed.message);
                    }
                }
            } catch {
                // Keep fallback message when response body is not JSON.
            }
        }

        alert(errorMessage);
    }
};
