# propertydocgen

Property Doc Generator - A CAP CDS application for generating rental agreements.

## Description

This is a rental agreement generation service built with SAP Cloud Application Programming (CAP) model. It provides OData v4 APIs for creating, validating, and managing rental agreements.

## Features

- **Generate Rental Agreements**: Create comprehensive rental agreements with landlord, tenant, and property details
- **Validate Agreement Data**: Validate rental agreement data before generation
- **Calculate Duration**: Calculate the duration between two dates in years, months, and days
- **Calculate Costs**: Calculate total monthly and yearly costs including rent, maintenance, and additional services

## Installation

```bash
npm install
```

## Database Setup

Deploy the database schema:

```bash
npm run deploy
```

## Running the Service

Start the service:

```bash
npm start
```

The service will be available at `http://localhost:4004/odata/v4/rental`

For development with auto-reload:

```bash
npm run watch
```

## API Documentation

See [TEST_DOCUMENTATION.md](./TEST_DOCUMENTATION.md) for comprehensive API documentation with examples.

### Available Endpoints

1. **Generate Agreement** (POST `/generateAgreement`)
   - Creates a rental agreement with full validation
   - Returns agreement summary with costs and duration

2. **Validate Agreement Data** (POST `/validateAgreementData`)
   - Validates rental agreement data
   - Returns validation errors and warnings

3. **Calculate Duration** (GET `/calculateDuration`)
   - Calculates duration between two dates
   - Returns years, months, days, and total days

4. **Calculate Total Costs** (Function)
   - Calculates monthly and yearly rental costs
   - Supports multiple billing frequencies

## Data Model

The application uses the following entities:

- **Landlord**: Property owner information
- **Tenant**: Renter information
- **Property**: Property details
- **RentalAgreement**: Complete rental agreement
- **FamilyMember**: Tenant's family members
- **AdditionalService**: Additional services like parking, utilities, etc.

## Technologies

- SAP Cloud Application Programming (CAP) Model
- Node.js
- Express
- SQLite (development)

## License

ISC

## Author

RJTechRamjee
