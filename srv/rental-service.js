const cds = require('@sap/cds');
const PDFDocument = require('pdfkit');

// Email validation regex supporting international domains, subdomains, plus signs, dots, and other valid patterns
const EMAIL_VALIDATION_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

module.exports = cds.service.impl(async function() {
  
  // Handler for generateAgreement action
  this.on('generateAgreement', async (req) => {
    const { landlord, tenant, property, agreementDetails, additionalServices, familyMembers } = req.data;
    
    try {
      // Validate input data
      const validationResult = await validateAgreementInput(landlord, tenant, property, agreementDetails, familyMembers);
      
      if (!validationResult.isValid) {
        return {
          success: false,
          agreementNumber: null,
          message: 'Validation failed',
          errors: validationResult.errors,
          validationWarnings: validationResult.warnings,
          pdfDocument: null,
          agreementSummary: null
        };
      }
      
      // Generate unique agreement number
      const agreementNumber = generateAgreementNumber();
      
      // Calculate duration
      const duration = calculateDurationInternal(agreementDetails.startDate, agreementDetails.endDate);
      
      // Calculate total costs
      const costs = calculateTotalCostsInternal(
        agreementDetails.rentAmount,
        agreementDetails.maintenanceCharges || 0,
        additionalServices || []
      );
      
      // Create agreement summary
      const agreementSummary = {
        landlordName: landlord.name,
        tenantName: tenant.name,
        propertyAddress: formatAddress(property.address),
        rentAmount: agreementDetails.rentAmount,
        duration: `${duration.years} year(s), ${duration.months} month(s), ${duration.days} day(s)`,
        totalFamilyMembers: familyMembers ? familyMembers.length : 0,
        totalServices: additionalServices ? additionalServices.length : 0,
        totalMonthlyCost: costs.monthlyTotal,
        totalYearlyCost: costs.yearlyTotal
      };
      
      // Generate PDF document
      const pdfBuffer = await generatePDF(
        agreementNumber,
        landlord,
        tenant,
        property,
        agreementDetails,
        additionalServices,
        familyMembers,
        duration,
        costs
      );
      
      return {
        success: true,
        agreementNumber: agreementNumber,
        message: 'Rental agreement generated successfully',
        errors: [],
        validationWarnings: validationResult.warnings,
        pdfDocument: pdfBuffer,
        agreementSummary: agreementSummary
      };
      
    } catch (error) {
      return {
        success: false,
        agreementNumber: null,
        message: `Error generating agreement: ${error.message}`,
        errors: [error.message],
        validationWarnings: [],
        pdfDocument: null,
        agreementSummary: null
      };
    }
  });
  
  // Handler for validateAgreementData action
  this.on('validateAgreementData', async (req) => {
    const { landlord, tenant, property, agreementDetails, familyMembers } = req.data;
    
    return validateAgreementInput(landlord, tenant, property, agreementDetails, familyMembers);
  });
  
  // Handler for calculateDuration function
  this.on('calculateDuration', async (req) => {
    const { startDate, endDate } = req.data;
    
    return calculateDurationInternal(startDate, endDate);
  });
  
  // Handler for calculateTotalCosts function
  this.on('calculateTotalCosts', async (req) => {
    const { rentAmount, maintenanceCharges, additionalServices } = req.data;
    
    return calculateTotalCostsInternal(rentAmount, maintenanceCharges || 0, additionalServices || []);
  });
});

// Helper function to validate agreement input
function validateAgreementInput(landlord, tenant, property, agreementDetails, familyMembers) {
  const errors = [];
  const warnings = [];
  
  // Validate landlord
  if (!landlord || !landlord.name) {
    errors.push('Landlord name is required');
  }
  if (!landlord || !landlord.contact || !landlord.contact.phone) {
    errors.push('Landlord phone number is required');
  }
  if (!landlord || !landlord.contact || !landlord.contact.email) {
    errors.push('Landlord email is required');
  }
  if (landlord && landlord.contact && landlord.contact.email && !isValidEmail(landlord.contact.email)) {
    errors.push('Landlord email is invalid');
  }
  if (!landlord || !landlord.address || !landlord.address.street) {
    errors.push('Landlord address street is required');
  }
  if (!landlord || !landlord.address || !landlord.address.city) {
    errors.push('Landlord address city is required');
  }
  
  // Validate tenant
  if (!tenant || !tenant.name) {
    errors.push('Tenant name is required');
  }
  if (!tenant || !tenant.contact || !tenant.contact.phone) {
    errors.push('Tenant phone number is required');
  }
  if (!tenant || !tenant.contact || !tenant.contact.email) {
    errors.push('Tenant email is required');
  }
  if (tenant && tenant.contact && tenant.contact.email && !isValidEmail(tenant.contact.email)) {
    errors.push('Tenant email is invalid');
  }
  if (!tenant || !tenant.idProofType) {
    errors.push('Tenant ID proof type is required');
  }
  if (!tenant || !tenant.idProofNumber) {
    errors.push('Tenant ID proof number is required');
  }
  
  // Validate property
  if (!property || !property.address || !property.address.street) {
    errors.push('Property address street is required');
  }
  if (!property || !property.propertyType) {
    errors.push('Property type is required');
  }
  
  // Validate agreement details
  if (!agreementDetails || !agreementDetails.startDate) {
    errors.push('Agreement start date is required');
  }
  if (!agreementDetails || !agreementDetails.endDate) {
    errors.push('Agreement end date is required');
  }
  if (agreementDetails && agreementDetails.startDate && agreementDetails.endDate) {
    const start = new Date(agreementDetails.startDate);
    const end = new Date(agreementDetails.endDate);
    if (end <= start) {
      errors.push('End date must be after start date');
    }
  }
  if (!agreementDetails || agreementDetails.rentAmount === undefined || agreementDetails.rentAmount <= 0) {
    errors.push('Rent amount must be greater than 0');
  }
  if (!agreementDetails || agreementDetails.securityDeposit === undefined || agreementDetails.securityDeposit < 0) {
    errors.push('Security deposit cannot be negative');
  }
  
  // Add warnings for optional but recommended fields
  if (!landlord || !landlord.taxID) {
    warnings.push('Landlord tax ID is recommended');
  }
  if (!landlord || !landlord.bankAccountNumber) {
    warnings.push('Landlord bank account number is recommended');
  }
  if (!tenant || !tenant.occupation) {
    warnings.push('Tenant occupation is recommended');
  }
  if (!familyMembers || familyMembers.length === 0) {
    warnings.push('No family members added - consider adding if applicable');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}

// Helper function to calculate duration
function calculateDurationInternal(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Calculate total days
  const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  
  // Calculate years, months, and days
  let years = 0;
  let months = 0;
  let days = 0;
  
  let tempDate = new Date(start);
  
  // Calculate years
  let nextYear = new Date(tempDate);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  while (nextYear <= end) {
    years++;
    tempDate = nextYear;
    nextYear = new Date(tempDate);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
  }
  
  // Calculate months
  let nextMonth = new Date(tempDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  while (nextMonth <= end) {
    months++;
    tempDate = nextMonth;
    nextMonth = new Date(tempDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
  }
  
  // Calculate remaining days
  days = Math.floor((end - tempDate) / (1000 * 60 * 60 * 24));
  
  return {
    days: days,
    months: months,
    years: years,
    totalDays: totalDays
  };
}

// Helper function to calculate total costs
function calculateTotalCostsInternal(rentAmount, maintenanceCharges, additionalServices) {
  const breakdown = [];
  let monthlyTotal = 0;
  
  // Add rent amount
  breakdown.push({
    item: 'Rent',
    amount: rentAmount,
    frequency: 'Monthly'
  });
  monthlyTotal += Number(rentAmount);
  
  // Add maintenance charges
  if (maintenanceCharges > 0) {
    breakdown.push({
      item: 'Maintenance Charges',
      amount: maintenanceCharges,
      frequency: 'Monthly'
    });
    monthlyTotal += Number(maintenanceCharges);
  }
  
  // Add additional services
  if (additionalServices && additionalServices.length > 0) {
    additionalServices.forEach(service => {
      const cost = Number(service.cost);
      const frequency = service.billingFrequency || 'Monthly';
      const frequencyLower = frequency.toLowerCase();
      
      breakdown.push({
        item: service.serviceName || 'Additional Service',
        amount: cost,
        frequency: frequency
      });
      
      // Convert to monthly equivalent
      let monthlyEquivalent = cost;
      switch (frequencyLower) {
        case 'monthly':
          monthlyEquivalent = cost;
          break;
        case 'quarterly':
          monthlyEquivalent = cost / 3;
          break;
        case 'yearly':
          monthlyEquivalent = cost / 12;
          break;
        case 'onetime':
          monthlyEquivalent = 0; // Don't include one-time in monthly total
          break;
        default:
          monthlyEquivalent = cost; // Assume monthly if unknown
      }
      
      if (frequencyLower !== 'onetime') {
        monthlyTotal += monthlyEquivalent;
      }
    });
  }
  
  const yearlyTotal = monthlyTotal * 12;
  
  return {
    monthlyTotal: monthlyTotal,
    yearlyTotal: yearlyTotal,
    breakdown: breakdown
  };
}

// Helper function to generate unique agreement number
function generateAgreementNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `AGR-${timestamp}-${random}`;
}

// Helper function to format address
function formatAddress(address) {
  if (!address) return '';
  
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);
  
  return parts.join(', ');
}

// Helper function to validate email
function isValidEmail(email) {
  return EMAIL_VALIDATION_REGEX.test(email);
}

// Helper function to generate PDF document
async function generatePDF(agreementNumber, landlord, tenant, property, agreementDetails, additionalServices, familyMembers, duration, costs) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
      
      // Set document metadata
      doc.info.Title = `Rental Agreement - ${agreementNumber}`;
      doc.info.Author = 'Property Doc Generator';
      
      // Title
      doc.fontSize(20).font('Helvetica-Bold').text('RENTAL AGREEMENT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica').text(`Agreement Number: ${agreementNumber}`, { align: 'center' });
      doc.moveDown(2);
      
      // Agreement Details Section
      doc.fontSize(14).font('Helvetica-Bold').text('AGREEMENT DETAILS');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Start Date: ${agreementDetails.startDate}`);
      doc.text(`End Date: ${agreementDetails.endDate}`);
      doc.text(`Duration: ${duration.years} year(s), ${duration.months} month(s), ${duration.days} day(s)`);
      doc.text(`Total Days: ${duration.totalDays}`);
      doc.moveDown();
      
      // Landlord Information
      doc.fontSize(14).font('Helvetica-Bold').text('LANDLORD INFORMATION');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${landlord.name}`);
      if (landlord.contact) {
        doc.text(`Phone: ${landlord.contact.phone || 'N/A'}`);
        doc.text(`Email: ${landlord.contact.email || 'N/A'}`);
        if (landlord.contact.alternatePhone) {
          doc.text(`Alternate Phone: ${landlord.contact.alternatePhone}`);
        }
      }
      if (landlord.address) {
        doc.text(`Address: ${formatAddress(landlord.address)}`);
      }
      if (landlord.taxID) {
        doc.text(`Tax ID: ${landlord.taxID}`);
      }
      if (landlord.bankAccountNumber) {
        doc.text(`Bank Account: ${landlord.bankAccountNumber}`);
        doc.text(`Bank Name: ${landlord.bankName || 'N/A'}`);
        doc.text(`Bank IFSC: ${landlord.bankIFSC || 'N/A'}`);
      }
      doc.moveDown();
      
      // Tenant Information
      doc.fontSize(14).font('Helvetica-Bold').text('TENANT INFORMATION');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${tenant.name}`);
      if (tenant.contact) {
        doc.text(`Phone: ${tenant.contact.phone || 'N/A'}`);
        doc.text(`Email: ${tenant.contact.email || 'N/A'}`);
        if (tenant.contact.alternatePhone) {
          doc.text(`Alternate Phone: ${tenant.contact.alternatePhone}`);
        }
      }
      if (tenant.occupation) {
        doc.text(`Occupation: ${tenant.occupation}`);
      }
      if (tenant.employer) {
        doc.text(`Employer: ${tenant.employer}`);
      }
      if (tenant.idProofType) {
        doc.text(`ID Proof Type: ${tenant.idProofType}`);
        doc.text(`ID Proof Number: ${tenant.idProofNumber || 'N/A'}`);
      }
      doc.moveDown();
      
      // Family Members
      if (familyMembers && familyMembers.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('FAMILY MEMBERS');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        familyMembers.forEach((member, index) => {
          doc.text(`${index + 1}. ${member.name} (${member.relationship}, Age: ${member.age || 'N/A'})`);
          if (member.idProofType) {
            doc.text(`   ID: ${member.idProofType} - ${member.idProofNumber || 'N/A'}`);
          }
        });
        doc.moveDown();
      }
      
      // Property Information
      doc.fontSize(14).font('Helvetica-Bold').text('PROPERTY DETAILS');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      if (property.address) {
        doc.text(`Address: ${formatAddress(property.address)}`);
      }
      doc.text(`Property Type: ${property.propertyType || 'N/A'}`);
      if (property.carpetArea) {
        doc.text(`Carpet Area: ${property.carpetArea} sq ft`);
      }
      if (property.builtUpArea) {
        doc.text(`Built-up Area: ${property.builtUpArea} sq ft`);
      }
      if (property.furnishingStatus) {
        doc.text(`Furnishing Status: ${property.furnishingStatus}`);
      }
      if (property.numberOfBedrooms) {
        doc.text(`Bedrooms: ${property.numberOfBedrooms}`);
      }
      if (property.numberOfBathrooms) {
        doc.text(`Bathrooms: ${property.numberOfBathrooms}`);
      }
      if (property.floorNumber) {
        doc.text(`Floor Number: ${property.floorNumber}`);
      }
      if (property.parkingSpaces) {
        doc.text(`Parking Spaces: ${property.parkingSpaces}`);
      }
      if (property.amenities) {
        doc.text(`Amenities: ${property.amenities}`);
      }
      doc.moveDown();
      
      // Financial Details
      doc.fontSize(14).font('Helvetica-Bold').text('FINANCIAL DETAILS');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Monthly Rent: ${agreementDetails.rentAmount || 0}`);
      doc.text(`Security Deposit: ${agreementDetails.securityDeposit || 0}`);
      if (agreementDetails.maintenanceCharges) {
        doc.text(`Maintenance Charges: ${agreementDetails.maintenanceCharges}`);
      }
      doc.text(`Total Monthly Cost: ${costs.monthlyTotal}`);
      doc.text(`Total Yearly Cost: ${costs.yearlyTotal}`);
      if (agreementDetails.paymentDueDay) {
        doc.text(`Payment Due Day: ${agreementDetails.paymentDueDay} of each month`);
      }
      if (agreementDetails.paymentMode) {
        doc.text(`Payment Mode: ${agreementDetails.paymentMode}`);
      }
      doc.moveDown();
      
      // Additional Services
      if (additionalServices && additionalServices.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('ADDITIONAL SERVICES');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        additionalServices.forEach((service, index) => {
          doc.text(`${index + 1}. ${service.serviceName || 'Service'}: ${service.cost || 0} (${service.billingFrequency || 'Monthly'})`);
          if (service.description) {
            doc.text(`   Description: ${service.description}`);
          }
        });
        doc.moveDown();
      }
      
      // Cost Breakdown
      if (costs.breakdown && costs.breakdown.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('COST BREAKDOWN');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        costs.breakdown.forEach((item) => {
          doc.text(`${item.item}: ${item.amount} (${item.frequency})`);
        });
        doc.moveDown();
      }
      
      // Agreement Terms
      doc.fontSize(14).font('Helvetica-Bold').text('TERMS AND CONDITIONS');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      if (agreementDetails.lockInPeriod) {
        doc.text(`Lock-in Period: ${agreementDetails.lockInPeriod} months`);
      }
      if (agreementDetails.noticePeriod) {
        doc.text(`Notice Period: ${agreementDetails.noticePeriod} days`);
      }
      if (agreementDetails.rentEscalation) {
        doc.text(`Rent Escalation: ${agreementDetails.rentEscalation}% every ${agreementDetails.escalationFrequency || 12} months`);
      }
      if (agreementDetails.terms) {
        doc.moveDown(0.5);
        doc.text(agreementDetails.terms, { align: 'justify' });
      }
      if (agreementDetails.specialConditions) {
        doc.moveDown();
        doc.fontSize(12).font('Helvetica-Bold').text('Special Conditions:');
        doc.fontSize(10).font('Helvetica').text(agreementDetails.specialConditions, { align: 'justify' });
      }
      doc.moveDown(2);
      
      // Signatures
      doc.fontSize(14).font('Helvetica-Bold').text('SIGNATURES');
      doc.moveDown(2);
      
      const leftMargin = 50;
      const rightMargin = doc.page.width - 200;
      
      doc.fontSize(10).font('Helvetica');
      doc.text('_____________________', leftMargin, doc.y);
      doc.text('_____________________', rightMargin, doc.y - 12);
      doc.moveDown(0.5);
      doc.text('Landlord Signature', leftMargin, doc.y);
      doc.text('Tenant Signature', rightMargin, doc.y - 12);
      doc.moveDown();
      doc.text(`Name: ${landlord.name}`, leftMargin, doc.y);
      doc.text(`Name: ${tenant.name}`, rightMargin, doc.y - 12);
      doc.moveDown();
      doc.text(`Date: _______________`, leftMargin, doc.y);
      doc.text(`Date: _______________`, rightMargin, doc.y - 12);
      
      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}
