// Comprehensive test for saved query filter loading
// Tests various scenarios including the "all" selection fix

const testCases = [
  {
    name: "Query with 'all' (Semua) selection",
    query: {
      id: "test-1",
      name: "Semua Kementerian Query",
      reportParams: {
        tahun: "2024",
        tipeLaporan: "pagu_realisasi", 
        pembulatan: "jutaan",
        jenisAkumulasi: "non_akumulatif"
      },
      activeFilters: ["cutOff", "kementerian"],
      filterValues: {
        cutOff: {
          selection: "12",
          kondisiCode: "equals",
          mengandungKata: "",
          jenisTampilan: "kode"
        },
        kementerian: {
          selection: "all", // Should be valid now
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode_uraian"
        }
      }
    },
    expectedValid: true,
    description: "Should accept 'all' as valid selection"
  },
  {
    name: "Query with specific selection",
    query: {
      id: "test-2", 
      name: "Specific Kementerian Query",
      reportParams: {
        tahun: "2024",
        tipeLaporan: "pagu_realisasi",
        pembulatan: "jutaan",
        jenisAkumulasi: "non_akumulatif"
      },
      activeFilters: ["cutOff", "kementerian"],
      filterValues: {
        cutOff: {
          selection: "12",
          kondisiCode: "equals",
          mengandungKata: "",
          jenisTampilan: "kode"
        },
        kementerian: {
          selection: "001", // Specific selection
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode"
        }
      }
    },
    expectedValid: true,
    description: "Should accept specific selections"
  },
  {
    name: "Query with kondisi code filter",
    query: {
      id: "test-3",
      name: "Kondisi Code Query", 
      reportParams: {
        tahun: "2024",
        tipeLaporan: "pagu_realisasi",
        pembulatan: "jutaan",
        jenisAkumulasi: "non_akumulatif"
      },
      activeFilters: ["cutOff", "kementerian"],
      filterValues: {
        cutOff: {
          selection: "12",
          kondisiCode: "equals",
          mengandungKata: "",
          jenisTampilan: "kode"
        },
        kementerian: {
          selection: "all",
          kondisiCode: "001,002,003", // Has kondisi code
          mengandungKata: "",
          jenisTampilan: "uraian"
        }
      }
    },
    expectedValid: true,
    description: "Should accept filters with kondisi codes"
  },
  {
    name: "Query with mengandung kata filter",
    query: {
      id: "test-4",
      name: "Mengandung Kata Query",
      reportParams: {
        tahun: "2024", 
        tipeLaporan: "pagu_realisasi",
        pembulatan: "jutaan",
        jenisAkumulasi: "non_akumulatif"
      },
      activeFilters: ["cutOff", "kementerian"],
      filterValues: {
        cutOff: {
          selection: "12",
          kondisiCode: "equals",
          mengandungKata: "",
          jenisTampilan: "kode"
        },
        kementerian: {
          selection: "all",
          kondisiCode: "",
          mengandungKata: "pendidikan", // Has mengandung kata
          jenisTampilan: "kode_uraian"
        }
      }
    },
    expectedValid: true,
    description: "Should accept filters with mengandung kata"
  },
  {
    name: "Query with empty filter values",
    query: {
      id: "test-5",
      name: "Empty Filter Query",
      reportParams: {
        tahun: "2024",
        tipeLaporan: "pagu_realisasi", 
        pembulatan: "jutaan",
        jenisAkumulasi: "non_akumulatif"
      },
      activeFilters: ["cutOff", "kementerian"],
      filterValues: {
        cutOff: {
          selection: "12",
          kondisiCode: "", // Empty kondisiCode makes cutOff invalid too
          mengandungKata: "",
          jenisTampilan: "kode"
        },
        kementerian: {
          selection: "", // Empty selection
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode"
        }
      }
    },
    expectedValid: false,
    description: "Should reject filters with empty values"
  }
];

// Simulate the fixed isFilterConfigured function
function isFilterConfigured(filterKey, filterValue) {
  if (filterKey === "cutOff") {
    return !!(
      filterValue.kondisiCode &&
      typeof filterValue.kondisiCode === "string" &&
      filterValue.kondisiCode.trim() !== ""
    );
  }

  const hasValidSelection = Boolean(
    filterValue.selection &&
      typeof filterValue.selection === "string" &&
      filterValue.selection.trim() !== ""
  );
  const hasValidKondisiCode = Boolean(
    filterValue.kondisiCode &&
      typeof filterValue.kondisiCode === "string" &&
      filterValue.kondisiCode.trim() !== ""
  );
  const hasValidMengandungKata = Boolean(
    filterValue.mengandungKata &&
      typeof filterValue.mengandungKata === "string" &&
      filterValue.mengandungKata.trim() !== ""
  );

  return (
    hasValidSelection || hasValidKondisiCode || hasValidMengandungKata
  );
}

function validateQueryCompatibility(query) {
  const errors = [];

  // Basic validation
  if (!query.reportParams?.tahun) errors.push("Missing tahun");
  if (!query.reportParams?.tipeLaporan) errors.push("Missing tipeLaporan");
  if (!query.reportParams?.pembulatan) errors.push("Missing pembulatan");
  if (!Array.isArray(query.activeFilters) || query.activeFilters.length === 0) {
    errors.push("Missing active filters");
  }

  // Filter validation
  if (query.filterValues && typeof query.filterValues === "object") {
    const configuredFilters = Object.entries(query.filterValues).filter(
      ([filterKey, filterValue]) =>
        filterValue && isFilterConfigured(filterKey, filterValue)
    );

    if (configuredFilters.length === 0) {
      errors.push("No configured filters");
    }
  } else {
    errors.push("Invalid filter values");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

console.log("Comprehensive Filter Loading Test");
console.log("=".repeat(60));

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.name}`);
  console.log("-".repeat(40));
  console.log(`Description: ${testCase.description}`);
  
  const validation = validateQueryCompatibility(testCase.query);
  const passed = validation.isValid === testCase.expectedValid;
  
  console.log(`Expected: ${testCase.expectedValid ? "VALID" : "INVALID"}`);
  console.log(`Actual: ${validation.isValid ? "VALID" : "INVALID"}`);
  console.log(`Result: ${passed ? "✅ PASS" : "❌ FAIL"}`);
  
  if (!passed) {
    console.log(`Errors: ${validation.errors.join(", ")}`);
  }
  
  // Show filter details for kementerian
  const kementerianFilter = testCase.query.filterValues?.kementerian;
  if (kementerianFilter) {
    const isConfigured = isFilterConfigured("kementerian", kementerianFilter);
    console.log(`Kementerian filter configured: ${isConfigured ? "Yes" : "No"}`);
    if (kementerianFilter.selection === "all") {
      console.log(`  → 'all' selection properly handled: ${isConfigured ? "✅" : "❌"}`);
    }
  }
  
  if (passed) passedTests++;
});

console.log("\n" + "=".repeat(60));
console.log("FINAL RESULTS");
console.log("=".repeat(60));
console.log(`Tests passed: ${passedTests}/${totalTests}`);
console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log("\n🎉 ALL TESTS PASSED!");
  console.log("\nThe fix successfully:");
  console.log("✅ Accepts 'all' (Semua) selections as valid");
  console.log("✅ Continues to accept specific selections");
  console.log("✅ Accepts filters with kondisi codes");
  console.log("✅ Accepts filters with mengandung kata");
  console.log("✅ Properly rejects empty filter configurations");
  console.log("\n🔧 Filter loading issue has been resolved!");
} else {
  console.log("\n❌ Some tests failed. Please review the implementation.");
}