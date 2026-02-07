import { useState } from "react";
import { PatientDashboard } from "./pages/PatientDashboard";
import { PatientView } from "./pages/PatientView";
import { getDefaultPatient } from "./data/patientData";

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'patient'>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(getDefaultPatient().id);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentView('patient');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  return (
    <>
      {currentView === 'dashboard' ? (
        <PatientDashboard onSelectPatient={handleSelectPatient} />
      ) : (
        <PatientView
          patientId={selectedPatientId}
          onBackToDashboard={handleBackToDashboard}
        />
      )}
    </>
  );
}
