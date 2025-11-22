using rental.agreement from '../db/schema';

service RentalService @(path: '/odata/v4/rental') {
  
  // Unbound action for generating rental agreement
  action generateAgreement(
    landlord: {
      name: String(200);
      contact: {
        phone: String(20);
        email: String(100);
        alternatePhone: String(20);
      };
      address: {
        street: String(200);
        city: String(100);
        state: String(100);
        postalCode: String(20);
        country: String(100);
      };
      taxID: String(50);
      bankAccountNumber: String(50);
      bankName: String(100);
      bankIFSC: String(20);
    },
    tenant: {
      name: String(200);
      contact: {
        phone: String(20);
        email: String(100);
        alternatePhone: String(20);
      };
      occupation: String(100);
      employer: String(200);
      idProofType: String(50);
      idProofNumber: String(100);
    },
    property: {
      address: {
        street: String(200);
        city: String(100);
        state: String(100);
        postalCode: String(20);
        country: String(100);
      };
      propertyType: String(50);
      carpetArea: Decimal(10,2);
      builtUpArea: Decimal(10,2);
      furnishingStatus: String(50);
      numberOfBedrooms: Integer;
      numberOfBathrooms: Integer;
      floorNumber: String(20);
      parkingSpaces: Integer;
      amenities: String(500);
    },
    agreementDetails: {
      startDate: Date;
      endDate: Date;
      rentAmount: Decimal(10,2);
      securityDeposit: Decimal(10,2);
      maintenanceCharges: Decimal(10,2);
      paymentDueDay: Integer;
      paymentMode: String(50);
      lockInPeriod: Integer;
      noticePeriod: Integer;
      rentEscalation: Decimal(5,2);
      escalationFrequency: Integer;
      terms: String(5000);
      specialConditions: String(2000);
    },
    additionalServices: array of {
      serviceName: String(100);
      description: String(500);
      cost: Decimal(10,2);
      billingFrequency: String(20);
      serviceType: String(50);
    },
    familyMembers: array of {
      name: String(200);
      relationship: String(50);
      age: Integer;
      idProofType: String(50);
      idProofNumber: String(100);
    }
  ) returns {
    success: Boolean;
    agreementNumber: String(50);
    message: String(500);
    errors: array of String;
    validationWarnings: array of String;
    pdfDocument: LargeBinary;
    agreementSummary: {
      landlordName: String(200);
      tenantName: String(200);
      propertyAddress: String(500);
      rentAmount: Decimal(10,2);
      duration: String(100);
      totalFamilyMembers: Integer;
      totalServices: Integer;
      totalMonthlyCost: Decimal(10,2);
      totalYearlyCost: Decimal(10,2);
    };
  };

  // Action for validating agreement data
  action validateAgreementData(
    landlord: {
      name: String(200);
      contact: {
        phone: String(20);
        email: String(100);
      };
      address: {
        street: String(200);
        city: String(100);
      };
    },
    tenant: {
      name: String(200);
      contact: {
        phone: String(20);
        email: String(100);
      };
      idProofType: String(50);
      idProofNumber: String(100);
    },
    property: {
      address: {
        street: String(200);
      };
      propertyType: String(50);
    },
    agreementDetails: {
      startDate: Date;
      endDate: Date;
      rentAmount: Decimal(10,2);
      securityDeposit: Decimal(10,2);
    },
    familyMembers: array of {
      name: String(200);
      relationship: String(50);
      age: Integer;
    }
  ) returns {
    isValid: Boolean;
    errors: array of String;
    warnings: array of String;
  };

  // Function for calculating agreement duration
  function calculateDuration(startDate: Date, endDate: Date) returns {
    days: Integer;
    months: Integer;
    years: Integer;
    totalDays: Integer;
  };

  // Function for calculating total costs
  function calculateTotalCosts(
    rentAmount: Decimal(10,2),
    maintenanceCharges: Decimal(10,2),
    additionalServices: array of {
      cost: Decimal(10,2);
      billingFrequency: String(20);
    }
  ) returns {
    monthlyTotal: Decimal(10,2);
    yearlyTotal: Decimal(10,2);
    breakdown: array of {
      item: String(100);
      amount: Decimal(10,2);
      frequency: String(20);
    };
  };
}