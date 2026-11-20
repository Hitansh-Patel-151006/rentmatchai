import { PROPERTY_STATUS, type Property, type User } from '../constants/initialData';
import { apiRequest, jsonBody } from './apiClient';

interface ApiProperty {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  property_type: string;
  monthly_rent: number | string;
  security_deposit?: number | string | null;
  bedrooms: number;
  bathrooms: number | string;
  area_sqft?: number | string | null;
  furnishing_status?: string | null;
  address_line?: string | null;
  locality?: string | null;
  city: string;
  state: string;
  available_from?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyFormData {
  title?: string;
  propertyType?: string;
  rent?: string | number;
  deposit?: string | number;
  location?: string;
  addressLine?: string;
  bedrooms?: string | number;
  bathrooms?: string | number;
  sqft?: string | number;
  furnishing?: string;
  availableFrom?: string;
  description?: string;
  status?: Property['status'];
  amenities?: string[];
  image?: string;
  gallery?: string[];
  commute?: string;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85';

function mapPropertyType(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (normalized.includes('studio')) return 'studio';
  if (normalized.includes('pg')) return 'pg';
  if (normalized.includes('room')) return 'room';
  if (normalized.includes('villa') || normalized.includes('house') || normalized.includes('floor')) return 'house';
  if (normalized.includes('apartment') || normalized.includes('penthouse')) return 'apartment';
  return 'other';
}

function displayPropertyType(type: string): string {
  const labels: Record<string, string> = {
    apartment: 'Apartment',
    house: 'Independent Floor',
    studio: 'Studio',
    pg: 'PG',
    room: 'Room',
    other: 'Other',
  };
  return labels[type] || type;
}

function mapProperty(apiProperty: ApiProperty, user?: User | null): Property {
  const image = PLACEHOLDER_IMAGE;
  return {
    id: apiProperty.id,
    listerId: apiProperty.owner_id,
    listerName: user?.id === apiProperty.owner_id
      ? [user.firstName, user.lastName && user.lastName !== 'User' ? user.lastName : ''].filter(Boolean).join(' ')
      : 'Property Owner',
    listerEmail: user?.id === apiProperty.owner_id ? user.email : '',
    listerPhone: user?.id === apiProperty.owner_id ? user.phone : '',
    title: apiProperty.title,
    propertyType: displayPropertyType(apiProperty.property_type),
    description: apiProperty.description,
    rent: Number(apiProperty.monthly_rent),
    deposit: Number(apiProperty.security_deposit || 0),
    bedrooms: apiProperty.bedrooms,
    bathrooms: Number(apiProperty.bathrooms),
    sqft: Number(apiProperty.area_sqft || 0),
    furnishing: apiProperty.furnishing_status || 'Unfurnished',
    location: [apiProperty.locality, apiProperty.city].filter(Boolean).join(', '),
    addressLine: apiProperty.address_line || '',
    amenities: [],
    status: apiProperty.status === 'published' ? PROPERTY_STATUS.ACTIVE : PROPERTY_STATUS.INACTIVE,
    availableFrom: apiProperty.available_from || 'Available now',
    match: 0,
    commute: '',
    verified: false,
    image,
    gallery: [image],
    createdAt: apiProperty.created_at,
    updatedAt: apiProperty.updated_at,
  };
}

function getLocationFields(location = ''): { city: string; locality: string | null } {
  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return { city: 'Gandhinagar', locality: null };
  if (parts.length === 1) return { city: 'Gandhinagar', locality: parts[0] };
  return { city: parts[parts.length - 1], locality: parts.slice(0, -1).join(', ') };
}

function mapPropertyInput(data: PropertyFormData, partial = false): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const add = (frontendKey: keyof PropertyFormData, backendKey: string, value: unknown) => {
    if (!partial || data[frontendKey] !== undefined) result[backendKey] = value;
  };
  const location = getLocationFields(data.location);
  const availableDate = data.availableFrom && /^\d{4}-\d{2}-\d{2}$/.test(data.availableFrom)
    ? data.availableFrom
    : null;

  add('title', 'title', data.title?.trim());
  add('description', 'description', data.description?.trim() || 'No description provided.');
  add('propertyType', 'property_type', mapPropertyType(data.propertyType || 'Apartment'));
  add('rent', 'monthly_rent', Number(data.rent));
  add('deposit', 'security_deposit', data.deposit ? Number(data.deposit) : null);
  add('bedrooms', 'bedrooms', Number(data.bedrooms || 1));
  add('bathrooms', 'bathrooms', Number(data.bathrooms || 1));
  add('sqft', 'area_sqft', data.sqft ? Number(data.sqft) : null);
  add('furnishing', 'furnishing_status', data.furnishing?.toLowerCase().replace('fully ', ''));
  add('addressLine', 'address_line', data.addressLine?.trim() || null);
  add('location', 'city', location.city);
  add('location', 'locality', location.locality);
  if (!partial) result.state = 'Gujarat';
  else if (data.location !== undefined) result.state = 'Gujarat';
  add('availableFrom', 'available_from', availableDate);
  if (data.status !== undefined) {
    result.status = data.status === PROPERTY_STATUS.ACTIVE ? 'published' : 'archived';
  }
  return result;
}

export const PropertyValidator = {
  validate(data: Partial<PropertyFormData>): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    if (!data.title?.trim() || data.title.trim().length < 5) errors.title = 'Title must be at least 5 characters long.';
    if (!data.description?.trim() || data.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long.';
    }
    if (!(Number(data.rent) > 0)) errors.rent = 'Please enter a valid monthly rent greater than 0.';
    if (!data.location?.trim() || data.location.trim().length < 3) errors.location = 'Please enter a location or locality.';
    if (!(Number(data.bedrooms) >= 1)) errors.bedrooms = 'Bedrooms count must be at least 1.';
    if (!data.propertyType) errors.propertyType = 'Please select a property type.';
    return { isValid: Object.keys(errors).length === 0, errors };
  },
};

export const PropertyService = {
  async getAllProperties(token?: string | null, user?: User | null): Promise<Property[]> {
    const publicProperties = await apiRequest<ApiProperty[]>('/properties/?limit=100');
    const ownedProperties = token
      ? await apiRequest<ApiProperty[]>('/properties/mine', { token })
      : [];
    const byId = new Map<string, ApiProperty>();
    for (const property of [...publicProperties, ...ownedProperties]) byId.set(property.id, property);
    return [...byId.values()].map((property) => mapProperty(property, user));
  },

  async getProperty(propertyId: string, token?: string | null, user?: User | null): Promise<Property> {
    const result = await apiRequest<ApiProperty>(`/properties/${encodeURIComponent(propertyId)}`, { token });
    return mapProperty(result, user);
  },

  async createProperty(token: string, data: PropertyFormData, user?: User | null): Promise<Property> {
    const validation = PropertyValidator.validate(data);
    if (!validation.isValid) throw Object.assign(new Error('Property validation failed.'), { validationErrors: validation.errors });
    const created = await apiRequest<ApiProperty>('/properties/', {
      method: 'POST',
      token,
      ...jsonBody(mapPropertyInput(data)),
    });
    return mapProperty(created, user);
  },

  async updateProperty(token: string, propertyId: string, data: PropertyFormData, user?: User | null): Promise<Property> {
    const updated = await apiRequest<ApiProperty>(`/properties/${encodeURIComponent(propertyId)}`, {
      method: 'PUT',
      token,
      ...jsonBody(mapPropertyInput(data, true)),
    });
    return mapProperty(updated, user);
  },

  async togglePropertyStatus(token: string, property: Property, user?: User | null): Promise<Property> {
    const nextStatus = property.status === PROPERTY_STATUS.ACTIVE
      ? PROPERTY_STATUS.INACTIVE
      : PROPERTY_STATUS.ACTIVE;
    return this.updateProperty(token, property.id, { status: nextStatus }, user);
  },

  async deleteProperty(token: string, propertyId: string): Promise<void> {
    await apiRequest<void>(`/properties/${encodeURIComponent(propertyId)}`, {
      method: 'DELETE',
      token,
    });
  },
};
