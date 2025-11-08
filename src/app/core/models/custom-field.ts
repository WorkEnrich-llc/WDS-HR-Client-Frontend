
export interface CustomField {
   id: number | string;
   fieldName: string;
   infoSection: TargetModelItem;
   dataType: DataType;
   mandatory: boolean;

}
type FieldValue = string | number | boolean | null;
export interface CustomFieldObject {
   id: number;
   target_model: string;
   input_option: InputOption;
   is_active: boolean;
   created_at: string;
   updated_at: string;
}

export interface InputOption {
   label: string;
   placeholder: string | null;
   value: string | null;
   type: FieldValue;
   required: boolean;
   min_length: number | null;
   max_length: number | null;
   pattern: string;
   options: any[];
   default: any | null;
   help_text: string;
   generate_signed_url: boolean;
   file_settings: FileSettings;
}

export interface FileSettings {
   max_size: number | null;
   allowed_extensions: string[];
}

export interface RequestData {
   target_model: string;
   input_option: InputOption;
}

export interface CreateFieldRequest {
   request_data: RequestData;
}

export interface TargetModelItem {
   name: string;
   value: string;
}

export interface TargetModelResponse {
   details: string;
   data: {
      list_items: TargetModelItem[];
      total_items: number;
      page: number;
      total_pages: number;
   };
}


export interface CustomFieldDetailData {
   subscription: object;
   object_info: CustomFieldObject;
   error_handling: string[] | unknown[];
}

export interface ApiResponse<TData> {
   details: string;
   data: TData;
}

export interface DataType {
   id?: string;
   name: string;
   value: string;
}
export type CustomFieldDetailResponse = ApiResponse<CustomFieldDetailData>;

export interface UpdateFieldRequestData extends RequestData {
   id?: number;
}


export interface UpdateFieldRequest {
   request_data: UpdateFieldRequestData;
}

export interface UpdateStatusData {
   status: boolean;
}


export interface UpdateStatusRequest {
   request_data: UpdateStatusData;
}

export interface CustomFieldFilters {
   search?: string;
   is_active?: boolean;
}