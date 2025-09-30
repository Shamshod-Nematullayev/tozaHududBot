export interface ICourtCase {
  claim_id: string;
  claim_type: string;
  claim_ministry_id: string | null;
  claim_case_number: string;
  claim_volume_number: string | null;
  claim_kind: string;
  is_movable_property: boolean | null;
  external_case_id: string | null;
  claim_state_duties: string | null;
  court_id: string;
  parent_court_id: string | null;
  case_id: string;
  case_responsible_judge_id: string;
  case_previous_id: string | null;
  case_doc_number: string | null;
  case_doc_date: string;
  e_client_id: string | null;
  case_base_case_id: string | null;
  case_delivery_type_id: string;
  case_registry_date: string;
  case_registry_number: string;
  case_current_status: string;
  case_case_result: string;
  instance: string;
  definition_date: string;

  case_court: Court;

  reject_return_articles: Article[];

  claim_amounts_with_parts: ClaimAmountWithParts[];

  case_participants: CaseParticipant[];

  case_case_documents: CaseCaseDocument[];

  claimants: ParticipantDetails[];

  defendants: ParticipantDetails[];

  claim_receipt_post: ClaimReceipt[];

  receipts: ReceiptWrapper[];
}

// =================== Sub Interfaces ===================

export interface Court {
  id: string;
  names: LocalizedNames;
}

export interface LocalizedNames {
  qq: string;
  ru: string;
  uz: string;
  uz_cyr: string;
}

export interface Article {
  id: string;
  names: LocalizedNames;
}

export interface ClaimAmountWithParts {
  claim_amount: ClaimAmount;
  claim_amount_parts: ClaimAmountPart[];
}

export interface ClaimAmount {
  id: string;
  amount: number;
  forfeit: number | null;
  currency_id: string;
  cost_recovery_type: string;
}

export interface ClaimAmountPart {
  id: string;
  amount: number;
  amount_type: string;
  amount_category_id: string | null;
  details: string | null;
}

export interface CaseParticipant {
  entity: Entity;
  participant: Participant;
  entity_details: EntityDetails;
}

export interface Entity {
  id: string;
  tin: number | null;
  pinfl: number | null;
  parent_id: string | null;
  parent_tin: string | null;
  not_citizen: boolean;
}

export interface Participant {
  id: string;
  type: string;
  case_id: string;
  is_main: boolean;
  entity_id: string;
  is_official: boolean;
  is_appellant: boolean;
  accusation_id: string | null;
  entity_details_id: string;
  merged_from_case_id: string | null;
}

export interface EntityDetails {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  address: string | null;
  birth_date: string | null;
  country_id: string | null;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  entity_type: string;
  passport_number: string | null;
  passport_serial: string | null;
  [key: string]: any;
}

export interface CaseCaseDocument {
  case_document: CaseDocument;
  service_task_file: ServiceTaskFile | null;
  participants: string[] | null;
  participants_with_deliveries: any[] | null;
}

export interface CaseDocument {
  id: string;
  instance: string;
  owner_name: string;
  is_show_send_button: boolean;
  outgoing_date: string | null;
  type_id: string;
  category: string;
  is_appealable: boolean;
  docx: FileMeta | null;
  pdf: FileMeta | null;
}

export interface FileMeta {
  id: string;
  name: string;
  mime_type: string;
  size: number;
}

export interface ServiceTaskFile {
  id: string;
  incoming_file_id: string;
  case_document_id: string;
  status: string;
}

export interface ParticipantDetails {
  id: string;
  name: string | null;
  gender: string | null;
  address: string | null;
  pinfl: number | null;
  birth_date: string | null;
  entity_type: string;
  is_main: boolean;
  passport_number: string | null;
  passport_serial: string | null;
  participant_id: string;
  [key: string]: any;
}

export interface ClaimReceipt {
  id: string;
  receipt_date: string;
  receipt_number: string;
  case_id: string;
  claim_id: string;
  type: string;
  total: number;
  currency_id: string;
}

export interface ReceiptWrapper {
  receipt: Receipt;
}

export interface Receipt {
  currency_id: string;
  type: string;
  receipt_date: string;
  receipt_number: string;
  total: number;
}

export interface CaseDocumentFull {
  id: string;
  document_group: string;
  instance: string;
  case_execution_id: string | null;
  case_id: string;
  delivery_type_id: string;
  type_id: string;
  is_show_send_button: boolean;
  with_qr_code: boolean;
  is_signed: boolean;
  service_task_file: any | null; // agar kerak bo‘lsa alohida interfeys qilinadi
  owner_name: string;
  pub_entity_detail_id: string;
  deliveries: Delivery[];
  outgoing_date: string | null;
  document_type_names: LocalizedNames;
  docx: FileMeta;
  pdf: FileMeta;
  document_template_id: string | null;
  judge_sign: string | null;
  file_id: string;
  e_qabul_user_id: string | null;
  is_file_exists: boolean;
  parent_id: string | null;
  public_version_id: string | null;
  error_on_public_version: boolean;
  error_on_watermark_adding: boolean;
  in_the_review: boolean;
  in_the_review_date: string | null;
  uuid_on_editor: string | null;
  impersonated_version_id: string | null;
  has_watermark: boolean;
}

export interface Delivery {
  delivery_category: string;
  status: string;
}
