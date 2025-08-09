export interface MiscApplication {
  _id: string;
  description: string;
  featureCode: string;
  destination: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MiscApplicationFormData {
  description: string;
  featureCode: string;
  destination: string;
}

export interface MiscApplicationErrorState {
  description?: string;
  featureCode?: string;
  destination?: string;
  general?: string;
}
