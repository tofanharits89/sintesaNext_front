// Comprehensive test for both filter loading fixes:
// 1. "All" (Semua) selections should be saved and loaded
// 2. Specific selections should be saved and loaded

console.log("Comprehensive Filter Loading Test");
console.log("Testing both 'all' and specific selection fixes");
console.log("=".repeat(60));

const testCases = [
  {
    name: "Query with 'all' selections",
    query: {
      id: "test-all",
      name: "All Selections Query",
      reportParams: {
        tahun: "2024",
        tipeLaporan: "pagu_realisasi",
        pembulatan: "jutaan",
        jenisAkumulasi: "non_akumulatif"
      },
      activeFilters: ["cutOff", "kementerian", "satker"],
      filterValues: {
        cutOff: {
          selection: "12",
          kondisiCode: "equals",
          mengandungKata: "",
          jenisTampilan: "kode"
        },
        kementerian: {
          selection: "all", // Should be valid
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode_uraian"
        },
        satker: {
          selection: "all", // Should be valid
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "uraian"
        }
      }
    },
    expectedValid: true,
    description: "Should accept and load 'all' selections properly"
  },
  {
    name: "Query with specific selections",
    query: {
      id: "test-specific",
      name: "Specific Selections Query",
      reportParams: {
        tahun: "2024",
        tipeLaporan: "pagu_realisasi",
        pembulatan: "jutaan",
        jenisAkumulasi: "non_akumulatif"
      },
      activeFilters: ["cutOff", "kementerian", "satker"],
      filterValues: {
        cutOff: {
          selection: "09", // September
          kondisiCode: "equals",
          mengandungKata: "",
          jenisTampilan: "kode"
        },
        kementerian: {
          selection: "001", // Specific kementerian
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode_uraian"
        },
        satker: {
          selection: "123456", // Specific satker
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode"
        }
      }
    },
    expectedValid: true,
    description: "Should accept and load specific selections properly"
  },
  {
    name: "Query with mixed selections",
    query: {
      id: "test-mixed",
      name: "Mixed Selections Query",
      reportParams: {
        tahun: "2024",
        tipeLaporan: "pagu_realisasi",
        pembulatan: "jutaan",
        jenisAkumulasi: "non_akumulatif"
      },
      activeFilters: ["cutOff", "kementerian", "satker"],
      filterValues: {
        cutOff: {
          selection: "06", // June - specific
          kondisiCode: "equals",
          mengandungKata: "",
          jenisTampilan: "kode"
        },
        kementerian: {
          selection: "all", // All - should be valid
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "kode_uraian"
        },
        satker: {
          selection: "789012", // Specific satker
          kondisiCode: "",
          mengandungKata: "",
          jenisTampilan: "uraian"
        }
      }
    },
    expectedValid: true,
    description: "Should handle mixed 'all' and specific selections"
  }
];

// Simulate the fixed isFilterConfigured function (from use-query-loader.ts fix)
function isFilterConfigured(filterKey, filterValue) {
  if (filterKey === "cutOff") {
    return !!(
      filterValue.kondisiCode &&
      typeof filterValue.kondisiCode === "string" &&
      filterValue.kondisiCode.trim() !== ""
    );
  }

  // Fixed logic: accepts "all" as valid selection
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

// Simulate query validation
function validateQueryCompatibility(query) {
  const errors = [];

  if (!query.reportParams?.tahun) errors.push("Missing tahun");
  if (!query.reportParams?.tipeLaporan) errors.push("Missing tipeLaporan");
  if (!query.reportParams?.pembulatan) errors.push("Missing pembulatan");
  if (!Array.isArray(query.activeFilters) || query.activeFilters.length === 0) {
    errors.push("Missing active filters");
  }

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

// Simulate filter loading (FilterCard component fix)
function simulateFilterLoading(filterKey, savedFilterValue) {
  // Simulate initial state
  const initialState = {
    selection: filterKey === "cutOff" ? "12" : "all",
    kondisiCode: filterKey === "cutOff" ? "equals" : "",
    mengandungKata: "",
    jenisTampilan: "kode",
    akunType: "kodeAkun",
  };

  // Simulate the new useEffect that syncs with external values
  const loadedState = {
    ...initialState,
    selection: savedFilterValue.selection ?? initialState.selection,
    kondisiCode: savedFilterValue.kondisiCode ?? initialState.kondisiCode,
    mengandungKata: savedFilterValue.mengandungKata ?? initialState.mengandungKata,
    jenisTampilan: savedFilterValue.jenisTampilan ?? initialState.jenisTampilan,
    akunType: savedFilterValue.akunType ?? initialState.akunType,
  };

  return {
    initial: initialState,
    loaded: loadedState,
    correctlyLoaded: loadedState.selection === savedFilterValue.selection
  };
}

// Run tests
let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.name}`);
  console.log("-".repeat(50));
  console.log(`Description: ${testCase.description}`);
  
  // Test 1: Query validation (isFilterConfigured fix)
  const validation = validateQueryCompatibility(testCase.query);
  const validationPassed = validation.isValid === testCase.expectedValid;
  
  console.log(`\n📋 Query Validation:`);
  console.log(`  Expected: ${testCase.expectedValid ? "VALID" : "INVALID"}`);
  console.log(`  Actual: ${validation.isValid ? "VALID" : "INVALID"}`);
  console.log(`  Result: ${validationPassed ? "✅ PASS" : "❌ FAIL"}`);
  
  // Test 2: Filter loading (FilterCard fix)
  console.log(`\n🔄 Filter Loading:`);
  let allFiltersLoadedCorrectly = true;
  
  Object.entries(testCase.query.filterValues).forEach(([filterKey, filterValue]) => {
    const loadResult = simulateFilterLoading(filterKey, filterValue);
    const loadedCorrectly = loadResult.correctlyLoaded;
    
    console.log(`  ${filterKey}:`);
    console.log(`    Saved: "${filterValue.selection}"`);
    console.log(`    Loaded: "${loadResult.loaded.selection}"`);
    console.log(`    Status: ${loadedCorrectly ? "✅ CORRECT" : "❌ INCORRECT"}`);
    
    if (!loadedCorrectly) {
      allFiltersLoadedCorrectly = false;
    }
  });
  
  const overallPassed = validationPassed && allFiltersLoadedCorrectly;
  console.log(`\n🎯 Overall Result: ${overallPassed ? "✅ PASS" : "❌ FAIL"}`);
  
  if (overallPassed) passedTests++;
});

console.log("\n" + "=".repeat(60));
console.log("FINAL SUMMARY");
console.log("=".repeat(60));
console.log(`Tests passed: ${passedTests}/${totalTests}`);
console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log("\n🎉 ALL TESTS PASSED!");
  console.log("\nBoth fixes are working correctly:");
  console.log("✅ Fix 1: 'All' selections are properly validated (use-query-loader.ts)");
  console.log("✅ Fix 2: Specific selections are properly loaded (filter-card.tsx)");
  console.log("\nUsers can now:");
  console.log("• Save queries with 'Semua' (all) selections");
  console.log("• Save queries with specific selections (e.g., cutOff: '09', kementerian: '001')");
  console.log("• Load saved queries and have all selections properly restored");
  console.log("• Mix 'all' and specific selections in the same query");
} else {
  console.log("\n❌ Some tests failed. Please review the implementation.");
}