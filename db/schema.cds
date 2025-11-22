namespace rental.agreement;

using { cuid, managed } from '@sap/cds/common';

type Address {
  street: String(200);
  city: String(100);
  state: String(100);
  postalCode: String(20);
  country: String(100);
}

type ContactInfo {
  phone: String(20);
  email: String(100);
  alternatePhone: String(20);
}

entity Landlord {
  key ID: UUID;
  name: String(200) not null;
  contact: ContactInfo;
  address: Address;
  taxID: String(50);
  bankAccountNumber: String(50);
  bankName: String(100);
  bankIFSC: String(20);
}

entity Tenant {
  key ID: UUID;
  name: String(200) not null;
  contact: ContactInfo not null;
  occupation: String(100);
  employer: String(200);
  employerAddress: Address;
  idProofType: String(50);
  idProofNumber: String(100);
  familyMembers: Composition of many FamilyMember on familyMembers.tenant = $self;
}

entity FamilyMember {
  key ID: UUID;
  tenant: Association to Tenant;
  name: String(200) not null;
  relationship: String(50) not null;
  age: Integer;
  idProofType: String(50);
  idProofNumber: String(100);
}

entity Property {
  key ID: UUID;
  address: Address not null;
  propertyType: String(50) not null; // Apartment, House, Commercial
  carpetArea: Decimal(10,2);
  builtUpArea: Decimal(10,2);
  furnishingStatus: String(50); // Furnished, Semi-Furnished, Unfurnished
  numberOfBedrooms: Integer;
  numberOfBathrooms: Integer;
  floorNumber: String(20);
  parkingSpaces: Integer;
  amenities: String(500);
}

entity AdditionalService {
  key ID: UUID;
  serviceName: String(100) not null;
  description: String(500);
  cost: Decimal(10,2) not null;
  billingFrequency: String(20); // Monthly, Quarterly, Yearly, OneTime
  serviceType: String(50); // Maintenance, Utilities, Parking, Other
}

entity RentalAgreement {
  key agreementID: UUID;
  agreementNumber: String(50);
  landlord: Landlord;
  tenant: Tenant;
  property: Property;
  startDate: Date not null;
  endDate: Date not null;
  rentAmount: Decimal(10,2) not null;
  securityDeposit: Decimal(10,2) not null;
  maintenanceCharges: Decimal(10,2);
  paymentDueDay: Integer; // Day of month
  paymentMode: String(50); // Bank Transfer, Cash, Cheque
  lockInPeriod: Integer; // in months
  noticePeriod: Integer; // in days
  rentEscalation: Decimal(5,2); // percentage
  escalationFrequency: Integer; // in months
  status: String(20); // Draft, Active, Expired, Terminated
  additionalServices: Composition of many AgreementService on additionalServices.agreement = $self;
  terms: String(5000);
  specialConditions: String(2000);
  createdAt: DateTime;
  generatedDocument: LargeBinary;
}

enity AgreementService {
  key ID: UUID;
  agreement: Association to RentalAgreement;
  service: AdditionalService;
}