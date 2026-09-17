/**
 * Custom Specialized Ledger Tree Definitions for Riverdale Specialty (RSH) and Highland Children's (HCP)
 * Metro St. Jude (MSJ) continues to use the General/Trauma base tree from seed_ledger_tree.json.
 */

export function getRiverdaleSpecialtyTree(): any {
  return {
    roots: [
      {
        code: "RSH-EXP",
        name: "Expense",
        is_root: true,
        groups: [
          {
            code: "RSH-CARD",
            name: "Cardiovascular & Cath-Lab Operations",
            subgroups: [
              {
                code: "RSH-CARD-STENT",
                name: "Coronary Stents & Balloons",
                ledgers: [
                  {
                    code: "RSH-CARD-STENT-DES",
                    name: "Drug-Eluting Stents (DES)",
                    vouchers: [
                      { date: "2026-08-03", type: "DR", amount: 48500.00, memo: "Everolimus-eluting stent batch restock" },
                      { date: "2026-08-19", type: "DR", amount: 32000.00, memo: "Bioresorbable vascular scaffold kit" }
                    ]
                  },
                  {
                    code: "RSH-CARD-STENT-PTCA",
                    name: "Angioplasty Balloon Catheters",
                    vouchers: [
                      { date: "2026-08-08", type: "DR", amount: 15400.00, memo: "High-pressure non-compliant balloons" },
                      { date: "2026-08-25", type: "DR", amount: 11200.00, memo: "Cutting balloon micro-catheters" }
                    ]
                  }
                ]
              },
              {
                code: "RSH-CARD-EP",
                name: "Electrophysiology & Pacemakers",
                ledgers: [
                  {
                    code: "RSH-CARD-EP-PACE",
                    name: "Implantable Cardiac Defibrillators & Leads",
                    vouchers: [
                      { date: "2026-08-06", type: "DR", amount: 62000.00, memo: "Dual-chamber MRI-conditional ICD units" },
                      { date: "2026-08-21", type: "DR", amount: 28400.00, memo: "Biventricular quadripolar lead sets" }
                    ]
                  },
                  {
                    code: "RSH-CARD-EP-ABL",
                    name: "Cardiac Ablation Consumables",
                    vouchers: [
                      { date: "2026-08-12", type: "DR", amount: 19800.00, memo: "Contact-force sensing ablation catheters" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            code: "RSH-NEURO",
            name: "Neuro-Spine & Robotic Surgery",
            subgroups: [
              {
                code: "RSH-NEURO-ROBOT",
                name: "Robotic Surgical Consumables",
                ledgers: [
                  {
                    code: "RSH-NEURO-ROBOT-ARMS",
                    name: "Robotic Instrument Multi-Fire Endowrists",
                    vouchers: [
                      { date: "2026-08-05", type: "DR", amount: 54000.00, memo: "da Vinci Xi robotic bipolar forceps & shears" },
                      { date: "2026-08-24", type: "DR", amount: 37500.00, memo: "Robotic stapler reloads & drapes" }
                    ]
                  },
                  {
                    code: "RSH-NEURO-ROBOT-MAINT",
                    name: "Surgical Robot AMC & Optical Calibration",
                    vouchers: [
                      { date: "2026-08-14", type: "DR", amount: 22000.00, memo: "Quarterly stereotactic optical arm calibration" }
                    ]
                  }
                ]
              },
              {
                code: "RSH-NEURO-SPINE",
                name: "Spinal Hardware & Neuromonitoring",
                ledgers: [
                  {
                    code: "RSH-NEURO-SPINE-IMP",
                    name: "Titanium Pedicle Screws & Cages",
                    vouchers: [
                      { date: "2026-08-09", type: "DR", amount: 41200.00, memo: "Minimally invasive expandable lumbar cages" },
                      { date: "2026-08-28", type: "DR", amount: 29800.00, memo: "Cervical arthroplasty disc implants" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            code: "RSH-IRAD",
            name: "Interventional Radiology & Imaging",
            subgroups: [
              {
                code: "RSH-IRAD-RADIO",
                name: "Radiopharmaceuticals & Tracers",
                ledgers: [
                  {
                    code: "RSH-IRAD-RADIO-PET",
                    name: "PET-CT Tracers & Rubidium Generators",
                    vouchers: [
                      { date: "2026-08-04", type: "DR", amount: 33500.00, memo: "Monthly 82Rb myocardial perfusion generator" },
                      { date: "2026-08-18", type: "DR", amount: 21000.00, memo: "Fluorodeoxyglucose 18F-FDG doses" }
                    ]
                  }
                ]
              },
              {
                code: "RSH-IRAD-CATH",
                name: "Angiography & Embolization Coils",
                ledgers: [
                  {
                    code: "RSH-IRAD-CATH-COIL",
                    name: "Platinum Microcoils & Stent Retrievers",
                    vouchers: [
                      { date: "2026-08-11", type: "DR", amount: 26800.00, memo: "Neurovascular detachable aneurysm coils" },
                      { date: "2026-08-26", type: "DR", amount: 18400.00, memo: "Acute ischemic stroke stent retriever kits" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            code: "RSH-PHARM",
            name: "Specialized Cardiac & Neuro Pharmacy",
            subgroups: [
              {
                code: "RSH-PHARM-CRIT",
                name: "Cardiovascular Emergency & Thrombolytics",
                ledgers: [
                  {
                    code: "RSH-PHARM-CRIT-TPA",
                    name: "Tenecteplase & Alteplase Vials",
                    vouchers: [
                      { date: "2026-08-07", type: "DR", amount: 38200.00, memo: "Acute STEMI tenecteplase stock replenishment" },
                      { date: "2026-08-22", type: "DR", amount: 27900.00, memo: "IV Bivalirudin direct thrombin inhibitors" }
                    ]
                  },
                  {
                    code: "RSH-PHARM-CRIT-INOTROP",
                    name: "Cardiogenic Shock Inotropes & Infusions",
                    vouchers: [
                      { date: "2026-08-15", type: "DR", amount: 16400.00, memo: "Levosimendan & Milrinone IV infusions" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            code: "RSH-RES",
            name: "Clinical Research & Trials Division",
            subgroups: [
              {
                code: "RSH-RES-PROTO",
                name: "IRB Clinical Protocols & Bio-banking",
                ledgers: [
                  {
                    code: "RSH-RES-PROTO-SPEC",
                    name: "Liquid Nitrogen Bio-specimen Cryo-vials",
                    vouchers: [
                      { date: "2026-08-10", type: "DR", amount: 14200.00, memo: "Cardiac tissue cryo-storage consumables" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: "RSH-INC",
        name: "Income",
        is_root: true,
        groups: [
          {
            code: "RSH-INC-PROC",
            name: "Cardiovascular Procedure Collections",
            subgroups: [
              {
                code: "RSH-INC-PROC-CATH",
                name: "Angioplasty & Structural Heart Collections",
                ledgers: [
                  {
                    code: "RSH-INC-PROC-CATH-REV",
                    name: "Inpatient Cath-Lab Stenting Billing",
                    vouchers: [
                      { date: "2026-08-04", type: "CR", amount: 185000.00, memo: "Payer remittance for 14 cardiac stenting cases" },
                      { date: "2026-08-20", type: "CR", amount: 142000.00, memo: "Transcatheter Aortic Valve Replacement (TAVR) batch" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            code: "RSH-INC-ROBOT",
            name: "Robotic Spine & Neuro-Surgery Collections",
            subgroups: [
              {
                code: "RSH-INC-ROBOT-REV",
                name: "Super-Specialty Robotic Surgery Packages",
                ledgers: [
                  {
                    code: "RSH-INC-ROBOT-REV-PKG",
                    name: "Commercial Insurance Robotic Procedure Payouts",
                    vouchers: [
                      { date: "2026-08-12", type: "CR", amount: 215000.00, memo: "BlueCross/Aetna neuro-spine surgical batch settlement" },
                      { date: "2026-08-27", type: "CR", amount: 168000.00, memo: "Cerebrovascular coiling procedure remittances" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            code: "RSH-INC-GRANT",
            name: "Clinical Trial Industry Sponsorship",
            subgroups: [
              {
                code: "RSH-INC-GRANT-IND",
                name: "Pharma Research Sponsor Grants",
                ledgers: [
                  {
                    code: "RSH-INC-GRANT-IND-RES",
                    name: "Cardiovascular Device Clinical Trial Milestones",
                    vouchers: [
                      { date: "2026-08-15", type: "CR", amount: 95000.00, memo: "MedTech sponsor Phase II trial milestone payment" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: "RSH-PRF",
        name: "Profit",
        is_root: true,
        groups: [
          {
            code: "RSH-PRF-OPS",
            name: "Specialty Surgical Operating Margins",
            subgroups: [
              {
                code: "RSH-PRF-OPS-SURP",
                name: "Cath-Lab & Robotic Operating Surplus",
                ledgers: [
                  {
                    code: "RSH-PRF-OPS-SURP-LED",
                    name: "Net Cardiology Clinical Contribution",
                    vouchers: [
                      { date: "2026-08-31", type: "CR", amount: 182000.00, memo: "Monthly cardiac program operating surplus" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: "RSH-LOS",
        name: "Loss",
        is_root: true,
        groups: [
          {
            code: "RSH-LOS-EXP",
            name: "Specialized Asset Depreciation & Scrap",
            subgroups: [
              {
                code: "RSH-LOS-EXP-BIO",
                name: "Expired Bio-Prosthetic Implants",
                ledgers: [
                  {
                    code: "RSH-LOS-EXP-BIO-SCRAP",
                    name: "Sterility Shelf-Life Write-offs",
                    vouchers: [
                      { date: "2026-08-30", type: "DR", amount: 16500.00, memo: "Expired biological tissue valve write-down" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
}

export function getHighlandChildrenTree(): any {
  return {
    roots: [
      {
        code: "HCP-EXP",
        name: "Expense",
        is_root: true,
        groups: [
          {
            code: "HCP-NICU",
            name: "Neonatal & Pediatric Intensive Care (NICU/PICU)",
            subgroups: [
              {
                code: "HCP-NICU-RESP",
                name: "Neonatal Respiratory Care",
                ledgers: [
                  {
                    code: "HCP-NICU-RESP-CIRCUIT",
                    name: "Infant Oscillator Ventilator Circuits",
                    vouchers: [
                      { date: "2026-08-02", type: "DR", amount: 24500.00, memo: "Nitric oxide delivery infant ventilator circuits" },
                      { date: "2026-08-16", type: "DR", amount: 18200.00, memo: "Micro-cannula heated humidified high-flow sets" }
                    ]
                  },
                  {
                    code: "HCP-NICU-RESP-SURF",
                    name: "Exogenous Lung Surfactant Therapy",
                    vouchers: [
                      { date: "2026-08-09", type: "DR", amount: 36000.00, memo: "Poractant alfa (Curosurf) intratracheal vials" },
                      { date: "2026-08-23", type: "DR", amount: 22500.00, memo: "Beractant intratracheal suspension restock" }
                    ]
                  }
                ]
              },
              {
                code: "HCP-NICU-INCUB",
                name: "Incubator & Micro-Environment Care",
                ledgers: [
                  {
                    code: "HCP-NICU-INCUB-PROBE",
                    name: "Isolette Climate Disposable Skin Sensors",
                    vouchers: [
                      { date: "2026-08-05", type: "DR", amount: 12800.00, memo: "Preemie dual-temp servo incubator probes" },
                      { date: "2026-08-20", type: "DR", amount: 8900.00, memo: "LED phototherapy fiber-optic blankets" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            code: "HCP-MAT",
            name: "Maternity & Labor-Delivery Center",
            subgroups: [
              {
                code: "HCP-MAT-LDR",
                name: "Labor & Birthing Suites Consumables",
                ledgers: [
                  {
                    code: "HCP-MAT-LDR-PACKS",
                    name: "Obstetric Sterile Delivery Packs",
                    vouchers: [
                      { date: "2026-08-04", type: "DR", amount: 28400.00, memo: "Sterile cesarean & natural delivery procedure packs" },
                      { date: "2026-08-18", type: "DR", amount: 19600.00, memo: "Cord blood collection & clamp kits" }
                    ]
                  },
                  {
                    code: "HCP-MAT-LDR-FETAL",
                    name: "Continuous Fetal Doppler Monitoring",
                    vouchers: [
                      { date: "2026-08-11", type: "DR", amount: 14200.00, memo: "Wireless telemetry fetal transducer belts" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            code: "HCP-GEN",
            name: "Pediatric Genetics & Newborn Screening",
            subgroups: [
              {
                code: "HCP-GEN-SCREEN",
                name: "Newborn Metabolic Blood Panels",
                ledgers: [
                  {
                    code: "HCP-GEN-SCREEN-MS",
                    name: "Tandem Mass Spectrometry Screening Cards",
                    vouchers: [
                      { date: "2026-08-07", type: "DR", amount: 31000.00, memo: "State-mandated newborn metabolic filter cards" },
                      { date: "2026-08-22", type: "DR", amount: 21500.00, memo: "Microarray comparative genomic hybridization kits" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            code: "HCP-PHARM",
            name: "Pediatric Formulation Pharmacy",
            subgroups: [
              {
                code: "HCP-PHARM-VAX",
                name: "Childhood Immunization Vaccines",
                ledgers: [
                  {
                    code: "HCP-PHARM-VAX-HEXA",
                    name: "Hexavalent DTaP-IPV-HepB-Hib Vaccines",
                    vouchers: [
                      { date: "2026-08-03", type: "DR", amount: 44000.00, memo: "Cold-chain certified childhood vaccine stock" },
                      { date: "2026-08-17", type: "DR", amount: 26500.00, memo: "Rotavirus & Pneumococcal conjugate doses" }
                    ]
                  },
                  {
                    code: "HCP-PHARM-VAX-TPN",
                    name: "Pediatric Total Parenteral Nutrition (TPN)",
                    vouchers: [
                      { date: "2026-08-10", type: "DR", amount: 33800.00, memo: "Custom neonatal amino-acid & lipid emulsion bags" },
                      { date: "2026-08-25", type: "DR", amount: 24200.00, memo: "Pediatric trace elements & multivitamin infusions" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            code: "HCP-NUTR",
            name: "Child Life & Specialized Infant Nutrition",
            subgroups: [
              {
                code: "HCP-NUTR-MILK",
                name: "Human Milk Bank & Specialized Formulas",
                ledgers: [
                  {
                    code: "HCP-NUTR-MILK-FORT",
                    name: "Pasteurized Donor Human Milk & Fortifiers",
                    vouchers: [
                      { date: "2026-08-06", type: "DR", amount: 22000.00, memo: "Accredited donor human milk & protein fortifiers" },
                      { date: "2026-08-21", type: "DR", amount: 15400.00, memo: "Amino acid-based hypoallergenic infant formulas" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: "HCP-INC",
        name: "Income",
        is_root: true,
        groups: [
          {
            code: "HCP-INC-NICU",
            name: "Level IV NICU Inpatient Collections",
            subgroups: [
              {
                code: "HCP-INC-NICU-COLL",
                name: "Neonatal Intensive Bed Reimbursements",
                ledgers: [
                  {
                    code: "HCP-INC-NICU-COLL-MED",
                    name: "Medicaid & State Neonatal Critical Care Billing",
                    vouchers: [
                      { date: "2026-08-05", type: "CR", amount: 240000.00, memo: "Monthly state pediatric intensive care remittance" },
                      { date: "2026-08-19", type: "CR", amount: 175000.00, memo: "Commercial insurer NICU complex case settlement" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            code: "HCP-INC-MAT",
            name: "Maternity & Delivery Bundles",
            subgroups: [
              {
                code: "HCP-INC-MAT-BUNDLE",
                name: "Obstetric Inpatient Billings",
                ledgers: [
                  {
                    code: "HCP-INC-MAT-BUNDLE-REV",
                    name: "Comprehensive Mother-Baby Delivery Collections",
                    vouchers: [
                      { date: "2026-08-12", type: "CR", amount: 195000.00, memo: "Private insurance maternal bundle settlement" },
                      { date: "2026-08-26", type: "CR", amount: 138000.00, memo: "Midwife & labor suite collections" }
                    ]
                  }
                ]
              }
            ]
          },
          {
            code: "HCP-INC-ENDOW",
            name: "Children's Miracle Network & Foundation Endowments",
            subgroups: [
              {
                code: "HCP-INC-ENDOW-CHARITY",
                name: "Pediatric Charity Care Subsidies",
                ledgers: [
                  {
                    code: "HCP-INC-ENDOW-CHARITY-FND",
                    name: "Philanthropic Children's Health Foundation Grant",
                    vouchers: [
                      { date: "2026-08-15", type: "CR", amount: 110000.00, memo: "Annual philanthropic foundation pediatric subsidy" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: "HCP-PRF",
        name: "Profit",
        is_root: true,
        groups: [
          {
            code: "HCP-PRF-OPS",
            name: "Pediatric Program Operating Surplus",
            subgroups: [
              {
                code: "HCP-PRF-OPS-SURP",
                name: "Maternal & Child Health Surplus",
                ledgers: [
                  {
                    code: "HCP-PRF-OPS-SURP-LED",
                    name: "Highland Children's Net Operating Margin",
                    vouchers: [
                      { date: "2026-08-31", type: "CR", amount: 142000.00, memo: "Monthly pediatric operating margin" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: "HCP-LOS",
        name: "Loss",
        is_root: true,
        groups: [
          {
            code: "HCP-LOS-CHARITY",
            name: "Charity Care & Non-Reimbursed Indigent Care",
            subgroups: [
              {
                code: "HCP-LOS-CHARITY-WRITE",
                name: "Uncompensated Pediatric Care Write-offs",
                ledgers: [
                  {
                    code: "HCP-LOS-CHARITY-WRITE-LED",
                    name: "Compassionate Care Sliding Scale Write-Downs",
                    vouchers: [
                      { date: "2026-08-30", type: "DR", amount: 18500.00, memo: "Uninsured pediatric emergency charity write-off" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
}
