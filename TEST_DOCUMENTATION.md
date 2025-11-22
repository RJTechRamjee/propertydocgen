# Rental Service Implementation - Test Documentation

This document provides examples of how to test the implemented rental service endpoints.

## Prerequisites

Start the service:
```bash
npm start
```

The service will be available at `http://localhost:4004/odata/v4/rental`

## Available Endpoints

### 1. Generate Agreement (Action)

Creates a complete rental agreement with validation.

**HTTP Method:** POST  
**URL:** `/odata/v4/rental/generateAgreement`

**Example Request:**
```bash
curl -X POST "http://localhost:4004/odata/v4/rental/generateAgreement" \
  -H "Content-Type: application/json" \
  -d '{
    "landlord": {
      "name": "John Doe",
      "contact": {
        "phone": "+1234567890",
        "email": "john@example.com",
        "alternatePhone": "+1234567891"
      },
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postalCode": "10001",
        "country": "USA"
      },
      "taxID": "TAX123456",
      "bankAccountNumber": "ACC123456789",
      "bankName": "Test Bank",
      "bankIFSC": "TEST0001234"
    },
    "tenant": {
      "name": "Jane Smith",
      "contact": {
        "phone": "+9876543210",
        "email": "jane@example.com",
        "alternatePhone": "+9876543211"
      },
      "occupation": "Software Engineer",
      "employer": "Tech Corp",
      "idProofType": "Passport",
      "idProofNumber": "P123456"
    },
    "property": {
      "address": {
        "street": "456 Oak Ave",
        "city": "Los Angeles",
        "state": "CA",
        "postalCode": "90001",
        "country": "USA"
      },
      "propertyType": "Apartment",
      "carpetArea": 1200,
      "builtUpArea": 1500,
      "furnishingStatus": "Fully Furnished",
      "numberOfBedrooms": 2,
      "numberOfBathrooms": 2,
      "floorNumber": "5",
      "parkingSpaces": 1,
      "amenities": "Gym, Pool, Security"
    },
    "agreementDetails": {
      "startDate": "2025-01-01",
      "endDate": "2026-01-01",
      "rentAmount": 10000,
      "securityDeposit": 20000,
      "maintenanceCharges": 2000,
      "paymentDueDay": 5,
      "paymentMode": "Bank Transfer",
      "lockInPeriod": 12,
      "noticePeriod": 30,
      "rentEscalation": 5,
      "escalationFrequency": 12,
      "terms": "Standard rental terms",
      "specialConditions": "None"
    },
    "additionalServices": [
      {
        "serviceName": "Parking",
        "description": "Reserved parking space",
        "cost": 1000,
        "billingFrequency": "Monthly",
        "serviceType": "Parking"
      }
    ],
    "familyMembers": [
      {
        "name": "John Smith",
        "relationship": "Spouse",
        "age": 30,
        "idProofType": "Passport",
        "idProofNumber": "P654321"
      }
    ]
  }'
```

**Example Response:**
```json
{
  "success": true,
  "agreementNumber": "AGR-1763795647095-172",
  "message": "Rental agreement generated successfully",
  "errors": [],
  "validationWarnings": [],
  "agreementSummary": {
    "landlordName": "John Doe",
    "tenantName": "Jane Smith",
    "propertyAddress": "456 Oak Ave, Los Angeles, CA, 90001, USA",
    "rentAmount": 10000,
    "duration": "1 year(s), 0 month(s), 0 day(s)",
    "totalFamilyMembers": 1,
    "totalServices": 1,
    "totalMonthlyCost": 13000,
    "totalYearlyCost": 156000
  }
}
```

### 2. Validate Agreement Data (Action)

Validates agreement data before generating the agreement.

**HTTP Method:** POST  
**URL:** `/odata/v4/rental/validateAgreementData`

**Example Request:**
```bash
curl -X POST "http://localhost:4004/odata/v4/rental/validateAgreementData" \
  -H "Content-Type: application/json" \
  -d '{
    "landlord": {
      "name": "John Doe",
      "contact": {
        "phone": "+1234567890",
        "email": "john@example.com"
      },
      "address": {
        "street": "123 Main St",
        "city": "New York"
      }
    },
    "tenant": {
      "name": "Jane Smith",
      "contact": {
        "phone": "+9876543210",
        "email": "jane@example.com"
      },
      "idProofType": "Passport",
      "idProofNumber": "P123456"
    },
    "property": {
      "address": {
        "street": "456 Oak Ave"
      },
      "propertyType": "Apartment"
    },
    "agreementDetails": {
      "startDate": "2025-01-01",
      "endDate": "2026-01-01",
      "rentAmount": 10000,
      "securityDeposit": 20000
    },
    "familyMembers": []
  }'
```

**Example Response:**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [
    "Landlord tax ID is recommended",
    "Landlord bank account number is recommended",
    "Tenant occupation is recommended",
    "No family members added - consider adding if applicable"
  ]
}
```

### 3. Calculate Duration (Function)

Calculates the duration between two dates.

**HTTP Method:** GET  
**URL:** `/odata/v4/rental/calculateDuration(startDate=<date>,endDate=<date>)`

**Example Request:**
```bash
curl "http://localhost:4004/odata/v4/rental/calculateDuration(startDate=2025-01-01,endDate=2026-01-01)"
```

**Example Response:**
```json
{
  "days": 0,
  "months": 0,
  "years": 1,
  "totalDays": 365
}
```

### 4. Calculate Total Costs (Function)

Calculates total monthly and yearly costs including rent, maintenance, and additional services.

**Note:** This function accepts complex parameters (array of services). The implementation is complete in the service handler, and it can be tested programmatically through the CDS service APIs. Due to OData v4 limitations with complex parameters in GET requests, this function is best accessed through the service's internal APIs or by using the `generateAgreement` action which includes cost calculation.

**Internal Implementation Example (in code):**
```javascript
const result = await srv.run('calculateTotalCosts', {
  rentAmount: 10000,
  maintenanceCharges: 2000,
  additionalServices: [
    { cost: 1000, billingFrequency: 'Monthly' },
    { cost: 500, billingFrequency: 'Monthly' }
  ]
});
```

## Validation Rules

The service implements the following validation rules:

### Required Fields:
- **Landlord:** name, phone, email, address (street, city)
- **Tenant:** name, phone, email, ID proof type, ID proof number
- **Property:** address street, property type
- **Agreement Details:** start date, end date, rent amount (> 0), security deposit (≥ 0)

### Business Rules:
- End date must be after start date
- Email addresses must be valid format
- Rent amount must be greater than zero
- Security deposit cannot be negative

### Warnings (Recommended but not required):
- Landlord tax ID
- Landlord bank account details
- Tenant occupation
- Family members information

## Testing the Service

You can test all endpoints using the provided test script:

```bash
cd /tmp
./test-rental-service.sh
```

Or test individual endpoints using curl as shown in the examples above.

## Service Metadata

To view the complete OData metadata:
```bash
curl "http://localhost:4004/odata/v4/rental/\$metadata"
```

## Error Handling

All endpoints return appropriate error messages:

**Validation Error Example:**
```json
{
  "success": false,
  "agreementNumber": null,
  "message": "Validation failed",
  "errors": [
    "Landlord name is required",
    "Tenant email is invalid"
  ],
  "validationWarnings": [],
  "agreementSummary": null
}
```
