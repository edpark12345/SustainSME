import type { Scope3Category } from '../types';

/**
 * The 15 GHG-Protocol Scope 3 categories. Categories 1, 5, 8, 10, 11, 14 and 15
 * use the exact question text from the Figma screens; the remaining categories
 * follow the same gating pattern with category-appropriate wording.
 *
 * Gating convention:
 *  - a question with `parentId` + `showWhenParent` is an inline follow-up that
 *    only appears once the parent has that answer.
 *  - the question with `unlocksUploadOn` reveals the Excel download + upload
 *    section (and the manual data-entry table) when answered with that value.
 *
 * Data-method convention (see ../../EMISSION_METHODOLOGY.md §5): for purchased /
 * paid upstream categories (1, 2, 4, 6) the SME's realistic data is SPEND, so the
 * lead question asks for spend and physical quantities are the OPTIONAL refinement
 * (used wherever available, not only on the biggest lines). Other categories keep
 * their category-appropriate primary ask.
 */

const UNITS_MASS = ['KG', 'Tonnes', 'Litres', 'Units'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'INR'];

export const SCOPE3_CATEGORIES: Scope3Category[] = [
  {
    id: 1,
    name: 'Purchased goods and services',
    description:
      'Upstream (i.e. cradle-to-gate) emissions from the production of products purchased or acquired in the reporting cycle',
    relevanceHint:
      'Cradle-to-gate emissions from the production of products purchased or acquired in the reporting cycle.',
    templateFile: 'Scope 3 - Purchased goods & services',
    questions: [
      {
        id: 'q1',
        text: 'Do you have your total spend by supplier / spend category for purchased goods & services during the reporting year? (e.g. from your accounts-payable ledger)',
      },
      {
        id: 'q1b',
        text: 'Do you also have physical quantities (mass / no. of units) for any of these items — even just the largest ones? Providing them where available improves accuracy.',
        parentId: 'q1',
        showWhenParent: 'yes',
        optional: true,
      },
      {
        id: 'q2',
        text: 'Could you provide this in an Excel format (or a template we provide)?',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'category', label: 'Spend Category', type: 'select', options: ['Metals', 'Food & Meals', 'Packaging', 'Software', 'Electronics', 'Other'] },
      { key: 'supplier', label: 'Supplier Name (Optional)', type: 'text', optional: true },
      { key: 'spend', label: 'Spend', type: 'number' },
      { key: 'currency', label: 'Currency', type: 'select', options: CURRENCIES },
      { key: 'quantity', label: 'Quantity / Mass (Optional)', type: 'number', optional: true },
      { key: 'unit', label: 'Unit (Optional)', type: 'select', options: UNITS_MASS, optional: true },
    ],
  },
  {
    id: 2,
    name: 'Capital goods',
    description:
      'Cradle-to-gate emissions from the production of capital goods (machinery, equipment, buildings, vehicles) purchased in the reporting cycle',
    relevanceHint:
      'Cradle-to-gate emissions of capital goods (e.g. raw materials used for items capitalised in the reporting cycle).',
    templateFile: 'Scope 3 - Capital goods',
    questions: [
      {
        id: 'q1',
        text: 'Do you have your total spend on capital goods (machinery, equipment, buildings, vehicles) acquired during the reporting year?',
      },
      {
        id: 'q1b',
        text: 'Do you also have physical quantities (no. of units / mass) for any of these capital goods? (optional — improves accuracy where available)',
        parentId: 'q1',
        showWhenParent: 'yes',
        optional: true,
      },
      {
        id: 'q2',
        text: 'Could you provide this in an Excel format (or a template we provide)?',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'asset', label: 'Capital Good', type: 'select', options: ['Machinery', 'Equipment', 'Buildings', 'Vehicles', 'IT Hardware'] },
      { key: 'supplier', label: 'Supplier Name (Optional)', type: 'text', optional: true },
      { key: 'spend', label: 'Spend', type: 'number' },
      { key: 'currency', label: 'Currency', type: 'select', options: CURRENCIES },
      { key: 'quantity', label: 'Quantity (Optional)', type: 'number', optional: true },
    ],
  },
  {
    id: 3,
    name: 'Fuel and energy-related activities',
    description:
      'Emissions related to the production of fuels and energy purchased and consumed (not already in Scope 1 or 2), including T&D losses',
    relevanceHint:
      'Emissions related to extraction, production and transport of fuels, energy and electricity used in the reporting cycle.',
    templateFile: 'Scope 3 - Fuel & energy-related activities',
    questions: [
      {
        id: 'q1',
        text: 'Do you have data on the quantity of fuel and electricity consumed by your organization during the reporting year?',
      },
      {
        id: 'q2',
        text: 'Would you have transmission & distribution loss data for the electricity purchased (Optional)?',
        optional: true,
      },
      {
        id: 'q3',
        text: 'Would you have consolidated data in an excel format or data that can be formulated in an excel template we provide?',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'source', label: 'Energy Source', type: 'select', options: ['Electricity', 'Natural Gas', 'Diesel', 'Petrol', 'District Heat'] },
      { key: 'quantity', label: 'Quantity Consumed', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'select', options: ['kWh', 'Litres', 'Therms', 'MWh'] },
    ],
  },
  {
    id: 4,
    name: 'Upstream transportation and distribution',
    description:
      'Emissions from transportation and distribution of products purchased, and third-party transport services paid for by the company',
    relevanceHint:
      'Emissions from transportation spend for goods purchased from suppliers and transport paid by the company to move goods to its customers.',
    templateFile: 'Scope 3 - Upstream transportation & distribution',
    questions: [
      {
        id: 'q1',
        text: 'Do you have your total spend on transportation & distribution services during the reporting year?',
      },
      {
        id: 'q1b',
        text: 'Do you also have activity data (distance & mode, or tonne-km) for any of these movements? (optional — improves accuracy where available)',
        parentId: 'q1',
        showWhenParent: 'yes',
        optional: true,
      },
      {
        id: 'q2',
        text: 'Could you provide this in an Excel format (or a template we provide)?',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'service', label: 'Service / Lane (Optional)', type: 'text', optional: true },
      { key: 'spend', label: 'Spend', type: 'number' },
      { key: 'currency', label: 'Currency', type: 'select', options: CURRENCIES },
      { key: 'mode', label: 'Transport Mode (Optional)', type: 'select', options: ['Road', 'Rail', 'Air', 'Sea'], optional: true },
      { key: 'distance', label: 'Distance / tonne-km (Optional)', type: 'number', optional: true },
    ],
  },
  {
    id: 5,
    name: 'Waste generated in operations',
    description:
      "Emissions from third-party disposal and treatment of waste generated in company's owned or controlled operations in the reporting year",
    relevanceHint:
      "Emissions from third-party disposal and treatment of waste generated in the company's operations in the reporting year.",
    templateFile: 'Scope 3 - Waste generated in operations',
    questions: [
      {
        id: 'q1',
        text: 'Do you have data on total waste generated by your organization during the reporting year?',
      },
      {
        id: 'q2',
        text: 'Would you have the breakup of this total waste on quantities of waste disposed using different methods of disposal (incineration, recycling etc.)?',
      },
      {
        id: 'q3',
        text: 'Would you have breakup of this waste quantity data across the different types of materials across each of these methods (Optional)?',
        optional: true,
      },
      {
        id: 'q4',
        text: 'Would you have consolidated data in an excel format or data that can be formulated in an excel template we provide?',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'method', label: 'Disposal Method', type: 'select', options: ['Recycling', 'Composting', 'Landfilled', 'Treatment', 'Incineration'] },
      { key: 'wasteType', label: 'Waste Type (Optional)', type: 'text', optional: true },
      { key: 'quantity', label: 'Quantity of Waste', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'select', options: UNITS_MASS },
    ],
  },
  {
    id: 6,
    name: 'Business travel',
    description:
      'Emissions from the transportation of employees for business-related activities in vehicles operated by third parties',
    relevanceHint:
      'Emissions from the transportation of employees for business-related activities in vehicles operated by third parties.',
    templateFile: 'Scope 3 - Business travel',
    questions: [
      {
        id: 'q1',
        text: 'Do you have your total spend on business travel during the reporting year? (e.g. from your travel & expense system)',
      },
      {
        id: 'q1b',
        text: 'Do you also have trip-level data (distance & mode, hotel nights) for any of this travel? (optional — improves accuracy where available)',
        parentId: 'q1',
        showWhenParent: 'yes',
        optional: true,
      },
      {
        id: 'q2',
        text: 'Could you provide this in an Excel format (or a template we provide)?',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'category', label: 'Travel Category', type: 'select', options: ['Air', 'Rail', 'Road', 'Hotel', 'Other'] },
      { key: 'spend', label: 'Spend', type: 'number' },
      { key: 'currency', label: 'Currency', type: 'select', options: CURRENCIES },
      { key: 'distance', label: 'Distance / Nights (Optional)', type: 'number', optional: true },
      { key: 'unit', label: 'Unit (Optional)', type: 'select', options: ['km', 'nights'], optional: true },
    ],
  },
  {
    id: 7,
    name: 'Employee commuting',
    description:
      'Emissions from the transportation of employees between their homes and their worksites',
    relevanceHint:
      'Emissions from the transportation of employees between their homes and their worksites.',
    templateFile: 'Scope 3 - Employee commuting',
    questions: [
      {
        id: 'q1',
        text: 'Do you have survey data on employee commuting distance and mode of transport during the reporting year?',
      },
      {
        id: 'q1b',
        text: 'If NO, would you be able to provide the number of employees and average commuting distance by site?',
        parentId: 'q1',
        showWhenParent: 'no',
      },
      {
        id: 'q2',
        text: 'Would you have consolidated data in an excel format or data that can be formulated in an excel template we provide?',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'mode', label: 'Commute Mode', type: 'select', options: ['Car - Petrol', 'Car - Diesel', 'Car - EV', 'Public Transit', 'Cycle / Walk'] },
      { key: 'employees', label: 'No. of Employees', type: 'number' },
      { key: 'distance', label: 'Avg. Distance / Day', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'select', options: ['km', 'miles'] },
    ],
  },
  {
    id: 8,
    name: 'Upstream leased assets',
    description:
      'Emissions from the operation of assets (energy & fuel) that are leased by the company and not already included in scope 1 or 2 inventories',
    relevanceHint:
      'Emissions from the operation of assets (energy & fuel) leased by the company and not already included in scope 1 or 2 inventories.',
    templateFile: 'Scope 3 - Upstream Leased Assets',
    questions: [
      {
        id: 'q1',
        text: 'Do you have data on energy and/or fuel consumed in the assets leased by your organization during the reporting year?',
      },
      {
        id: 'q1b',
        text: 'If NO, would you be able to provide names and count of leased assets which have scope 1 & 2 GHG emissions (energy and fuel)?',
        parentId: 'q1',
        showWhenParent: 'no',
      },
      {
        id: 'q2',
        text: 'Would you be able to share basic statistical data about your leased assets (building type and floor area)?',
      },
      {
        id: 'q3',
        text: 'Would you have consolidated data in an excel format or data that can be formulated in an excel template we provide?',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'asset', label: 'Asset Name', type: 'text' },
      { key: 'assetType', label: 'Asset Type', type: 'select', options: ['Office', 'Manufacturing', 'Warehouse', 'ICE vehicle', 'Retail'] },
      { key: 'floorArea', label: 'Floor Area / No. of assets', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'select', options: ['Sq. Feet', 'Sq. Metre', 'Count'] },
    ],
  },
  {
    id: 9,
    name: 'Downstream transportation and distribution',
    description:
      'Emissions from transportation and distribution of sold products that are not paid for by the reporting company',
    relevanceHint:
      'Emissions from transportation and distribution of sold products that are NOT paid for by the reporting company.',
    templateFile: 'Scope 3 - Downstream transportation & distribution',
    questions: [
      {
        id: 'q1',
        text: 'Do you have data on distance and mode of transport for sold products distributed downstream during the reporting year?',
      },
      {
        id: 'q1b',
        text: 'If NO, would you be able to provide the total mass of products sold and average distribution distance?',
        parentId: 'q1',
        showWhenParent: 'no',
      },
      {
        id: 'q2',
        text: 'Would you have consolidated data in an excel format or data that can be formulated in an excel template we provide?',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'mode', label: 'Transport Mode', type: 'select', options: ['Road', 'Rail', 'Air', 'Sea'] },
      { key: 'product', label: 'Product (Optional)', type: 'text', optional: true },
      { key: 'distance', label: 'Distance / Mass-km', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'select', options: ['km', 'tonne-km'] },
    ],
  },
  {
    id: 10,
    name: 'Processing of sold products',
    description:
      'Emissions from processing of sold intermediate products by third parties (e.g., manufacturers) after sale (energy & fuel)',
    relevanceHint:
      'Emissions from processing of sold intermediate products by third parties (e.g. manufacturers) after sale (energy & fuel).',
    templateFile: 'Scope 3 - Processing of sold products',
    questions: [
      {
        id: 'q1',
        text: 'Do you collect data on electricity and/or fuel consumed by downstream customers for processing of sold product into final output?',
      },
      {
        id: 'q1b',
        text: 'If NO, would you be able to provide either weight (mass) or economic value of your sold products by product type?',
        parentId: 'q1',
        showWhenParent: 'no',
      },
      {
        id: 'q2',
        text: 'Would you also have data around the different processes involved in converting your sold product to final output (Optional)?',
        optional: true,
      },
      {
        id: 'q3',
        text: 'Would you have consolidated data in an excel format or data that can be formulated in an excel template we provide?',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'product', label: 'Product Name', type: 'text' },
      { key: 'process', label: 'Process Type (Optional)', type: 'select', options: ['Melting', 'Assembly', 'Molding', 'Machining'], optional: true },
      { key: 'mass', label: 'Mass of product', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'select', options: UNITS_MASS },
    ],
  },
  {
    id: 11,
    name: 'Use of sold products',
    description:
      'Emissions from the use-phase (electricity or fuel consumption) of goods and services sold in the reporting year',
    relevanceHint:
      'Emissions from the use-phase (electricity or fuel consumption) of goods and services sold in the reporting year.',
    templateFile: 'Scope 3 - Use of sold products',
    questions: [
      {
        id: 'q1',
        text: 'Would you be able to provide quantity (no. of units) of your sold products by product type?',
      },
      {
        id: 'q2',
        text: 'Do you collect actual/sample data on electricity and/or fuel consumption data of your sold products during its use phase (final consumption)?',
      },
      {
        id: 'q3',
        text: 'Do you estimate and can provide product lifetime data around no. of years it can be used for and no. of avg. usage instances per year?',
      },
      {
        id: 'q4',
        text: 'Would you have consolidated data in an excel format or data that can be formulated in an excel template we provide?',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'product', label: 'Product Name', type: 'text' },
      { key: 'qtySold', label: 'Quantity sold', type: 'number' },
      { key: 'usage', label: 'Usage instance per year (count)', type: 'number' },
      { key: 'lifetime', label: 'Lifetime (in yrs)', type: 'number' },
      { key: 'fuel', label: 'Fuel Type', type: 'select', options: ['Electricity', 'Diesel', 'Natural Gas', 'Petrol'] },
      { key: 'energy', label: 'Energy consumption', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'select', options: ['kWh', 'Litres', 'Therms'] },
    ],
  },
  {
    id: 12,
    name: 'End-of-life treatment of sold products',
    description:
      'Emissions from the waste disposal and treatment of products sold by the company at the end of their life',
    relevanceHint:
      'Emissions from the waste disposal and treatment of products sold by the company at the end of their life.',
    templateFile: 'Scope 3 - End-of-life treatment of products',
    questions: [
      {
        id: 'q1',
        text: 'Do you have data on the total mass of sold products and their expected end-of-life treatment (landfill, recycling, incineration)?',
      },
      {
        id: 'q1b',
        text: 'If NO, would you be able to provide the total mass of products sold by product type?',
        parentId: 'q1',
        showWhenParent: 'no',
      },
      {
        id: 'q2',
        text: 'Would you have consolidated data in an excel format or data that can be formulated in an excel template we provide?',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'product', label: 'Product Name', type: 'text' },
      { key: 'treatment', label: 'End-of-Life Treatment', type: 'select', options: ['Landfilled', 'Recycling', 'Incineration', 'Composting'] },
      { key: 'mass', label: 'Mass of product', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'select', options: UNITS_MASS },
    ],
  },
  {
    id: 13,
    name: 'Downstream leased assets',
    description:
      'Emissions from the operation of assets owned by the reporting company and leased to other entities, not already in scope 1 or 2',
    relevanceHint:
      'Emissions from operation of assets owned by the reporting company and leased to other entities (not already in scope 1 or 2).',
    templateFile: 'Scope 3 - Downstream Leased Assets',
    questions: [
      {
        id: 'q1',
        text: 'Do you have data on energy and/or fuel consumed in the assets you lease out to other entities during the reporting year?',
      },
      {
        id: 'q1b',
        text: 'If NO, would you be able to share building type and floor area of the assets you lease out?',
        parentId: 'q1',
        showWhenParent: 'no',
      },
      {
        id: 'q2',
        text: 'Would you have consolidated data in an excel format or data that can be formulated in an excel template we provide?',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'asset', label: 'Asset Name', type: 'text' },
      { key: 'assetType', label: 'Building Type', type: 'select', options: ['Office', 'Manufacturing', 'Warehouse', 'Retail'] },
      { key: 'floorArea', label: 'Floor Area', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'select', options: ['Sq. Feet', 'Sq. Metre'] },
    ],
  },
  {
    id: 14,
    name: 'Franchises',
    description:
      'Emissions from the operation of franchises (electricity and fuel) not included in scope 1 or scope 2 (energy consumption)',
    relevanceHint:
      'Emissions from the operation of franchises (electricity and fuel) not included in scope 1 or scope 2.',
    templateFile: 'Scope 3 - Franchises',
    questions: [
      {
        id: 'q1',
        text: 'Would you be able to provide names and count of your franchises which have scope 1 & 2 GHG emissions (company car, truck etc.)?',
      },
      {
        id: 'q2',
        text: 'Would you be able to share basic statistical data about your franchises (building type and floor area)?',
      },
      {
        id: 'q2b',
        text: 'If YES, Would you have consolidated data in an excel format or data that can be formulated in an excel template we provide?',
        parentId: 'q2',
        showWhenParent: 'yes',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'franchise', label: 'Franchise Name', type: 'text' },
      { key: 'buildingType', label: 'Building Type', type: 'select', options: ['Office', 'Manufacturing', 'Retail', 'Restaurant'] },
      { key: 'floorArea', label: 'Floor Area', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'select', options: ['Sq. Feet', 'Sq. Metre'] },
    ],
  },
  {
    id: 15,
    name: 'Investments',
    description:
      "Emissions associated with the reporting company's investments, not already included in scope 1 or scope 2",
    relevanceHint:
      "Emissions associated with the reporting company's investments, not already included in scope 1 or scope 2. Applicable to investors and financial-services companies.",
    templateFile: 'Scope 3 - Investments',
    questions: [
      {
        id: 'q1',
        text: "Would you be able to provide names of your company's investments and % of ownership share held by your company in those investments?",
      },
      {
        id: 'q2',
        text: 'Would you be able to share basic yearly revenue data and sector of operation of your invested companies for the reporting year?',
      },
      {
        id: 'q2b',
        text: 'If YES, Would you have consolidated data in an excel format or data that can be formulated in an excel template we provide?',
        parentId: 'q2',
        showWhenParent: 'yes',
        unlocksUploadOn: 'yes',
      },
    ],
    table: [
      { key: 'investment', label: 'Investment Name', type: 'text' },
      { key: 'sector', label: 'Sector / Industry', type: 'select', options: ['Pharmaceutical', 'Manufacturing', 'Agriculture', 'Public Services', 'Technology'] },
      { key: 'revenue', label: 'Yearly Revenue (Mn)', type: 'number' },
      { key: 'currency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP'] },
    ],
  },
];

export const getCategory = (id: number) =>
  SCOPE3_CATEGORIES.find((c) => c.id === id);

/**
 * Plain-language relevance questions (by category id) for the relevance screener.
 * We ask what an SME can actually answer ("Do your people travel for business?")
 * instead of showing the technical category definition. The definition stays
 * available as a secondary line / tooltip.
 */
export const RELEVANCE_QUESTIONS: Record<number, string> = {
  1: 'Do you buy goods, materials or services from suppliers?',
  2: 'Did you buy equipment, machinery, vehicles or furniture, or renovate your premises?',
  3: 'Do you use electricity, gas or other fuels?',
  4: 'Do you pay for transport or freight to bring goods in or send them out?',
  5: 'Does your business produce waste (office, packaging or production)?',
  6: 'Do your people travel for business (flights, trains, hotels)?',
  7: 'Do employees commute to a workplace?',
  8: "Do you rent premises or equipment where you don't directly pay the energy bill?",
  9: 'Do you sell physical products that are shipped onward to customers?',
  10: 'Do you sell semi-finished products that other companies process further?',
  11: 'Do you sell products that use energy or fuel when customers use them?',
  12: 'Do you sell physical products that are thrown away or recycled at end of life?',
  13: 'Do you lease out property or equipment to others?',
  14: 'Do you run a franchise model (you are the franchisor)?',
  15: 'Do you hold significant investments or provide financing?',
};
