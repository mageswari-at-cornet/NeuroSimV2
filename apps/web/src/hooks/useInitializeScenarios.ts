import { useEffect } from 'react';
import { useDashboardStore } from '../store/dashboardStore';

/**
 * Hook to fetch scenarios from API on mount and auto-load first one
 * Call this in your root App component
 */
export function useInitializeScenarios() {
    const { fetchScenarios, loadScenario, isLoadingScenarios, scenarios, error } = useDashboardStore();

    useEffect(() => {
        // Fetch scenarios when component mounts
        if (scenarios.length === 0 && !isLoadingScenarios) {
            fetchScenarios();
        }
    }, [fetchScenarios, isLoadingScenarios, scenarios.length]);

    // Auto-load first scenario (S1) when scenarios are fetched
    useEffect(() => {
        if (scenarios.length > 0) {
            console.log('🎯 Auto-loading first scenario:', scenarios[0].id, '-', scenarios[0].name);
            loadScenario(scenarios[0].id);
        }
    }, [scenarios.length]); // Only when scenarios array length changes

    return { isLoadingScenarios, scenarios, error };
}
