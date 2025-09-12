import { API_CONFIG, API_ENDPOINTS } from './config';

export interface MacroData {
	id: number;
	documentNumber: string;
	fileName: string;
	[key: string]: string | number;
}

export interface DocumentStatistics {
	documentNumber: string;
	totalRecords: number;
	lastModified: string;
	fileCount: number;
}

export interface UpdateRequest {
	id: number;
	documentNumber?: string;
	data: Record<string, string | number>;
}

export interface BulkUpdateRequest {
	documentNumber: string;
	updates: Array<{
		id: number;
		data: Record<string, string | number>;
	}>;
}

class MacroService {
	private baseUrl = API_CONFIG.BASE_URL;

	async quickSearchMakroOnly(documentNumber: string): Promise<MacroData[]> {
		const url = `${this.baseUrl}${API_ENDPOINTS.MACRO.QUICK_SEARCH_MAKRO_ONLY(documentNumber)}`;
		const response = await fetch(url, { method: 'GET', headers: API_CONFIG.HEADERS });
		if (!response.ok) throw new Error(await response.text());
		const result = await response.json();
		return result.data || result;
	}

	async searchInHesap(documentNumber: string): Promise<MacroData[]> {
		const url = `${this.baseUrl}${API_ENDPOINTS.MACRO.SEARCH_IN_HESAP(documentNumber)}`;
		const response = await fetch(url, { method: 'GET', headers: API_CONFIG.HEADERS });
		if (!response.ok) throw new Error(await response.text());
		const result = await response.json();
		return result.data || result;
	}

	async updateDocumentData(updateRequest: UpdateRequest): Promise<void> {
		const response = await fetch(
			`${this.baseUrl}${API_ENDPOINTS.MACRO.UPDATE_DOCUMENT_DATA}`,
			{
				method: 'PUT',
				headers: API_CONFIG.HEADERS,
				body: JSON.stringify(updateRequest),
			}
		);
		if (!response.ok) throw new Error(await response.text());
	}

	async bulkUpdateDocument(bulkUpdateRequest: BulkUpdateRequest): Promise<void> {
		const response = await fetch(
			`${this.baseUrl}${API_ENDPOINTS.MACRO.BULK_UPDATE_DOCUMENT}`,
			{
				method: 'PUT',
				headers: API_CONFIG.HEADERS,
				body: JSON.stringify(bulkUpdateRequest),
			}
		);
		if (!response.ok) throw new Error(await response.text());
	}

	async getDocumentStatistics(documentNumber: string): Promise<DocumentStatistics> {
		const response = await fetch(
			`${this.baseUrl}${API_ENDPOINTS.MACRO.DOCUMENT_STATISTICS(documentNumber)}`,
			{ method: 'GET', headers: API_CONFIG.HEADERS }
		);
		if (!response.ok) throw new Error(await response.text());
		return await response.json();
	}

	async getAvailableFiles(): Promise<string[]> {
		const response = await fetch(
			`${this.baseUrl}${API_ENDPOINTS.MACRO.AVAILABLE_FILES}`,
			{ method: 'GET', headers: API_CONFIG.HEADERS }
		);
		if (!response.ok) throw new Error(await response.text());
		return await response.json();
	}
}

const macroService = new MacroService();
export default macroService;
