import { useState, useEffect } from 'react';
import './ApiTest.css'; 

interface TestData {
    id: number;
    name: string;
    description: string;
    createdAt: string;
}

const ApiTest = () => {
    const [connectionStatus, setConnectionStatus] = useState<string>('');
    const [testData, setTestData] = useState<TestData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dynamiczne określanie adresu API
    const getApiUrl = () => {
        //const isContainer = window.location.hostname === 'retrocar-web-ui' ||
        //    window.location.hostname === 'localhost';

        //if (isContainer) {
        //    return 'http://retrocar-api/api/CarComponents';
        //} else {
        //    return 'https://localhost:5003/api/CarComponents';
        //}

        // Uproszczona wersja, używająca proxy
        return '/api';
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                //const response = await fetch(`${getApiUrl()}/test-connection`);
                const response = await fetch(`${getApiUrl()}/CarComponents/test-connection`);

                if (!response.ok) {
                    throw new Error(`Błąd HTTP: ${response.status}`);
                }

                const data = await response.json();
                setConnectionStatus(data.message);

                // Pobierz dane testowe
                //const dataResponse = await fetch(getApiUrl());
                const dataResponse = await fetch(`${getApiUrl()}/CarComponents`);
                if (!dataResponse.ok) {
                    throw new Error(`Błąd HTTP: ${dataResponse.status}`);
                }

                const testItems = await dataResponse.json();
                setTestData(testItems);
            } catch (err) {
                setError(`Błąd: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div>Ładowanie...</div>;
    if (error) return <div>Błąd: {error}</div>;

    return (
        <div>
            <h2>Test API</h2>
            <p>Status: {connectionStatus}</p>

            <h3>Dane testowe:</h3>
            <ul>
                {testData.map(item => (
                    <li key={item.id}>
                        <strong>{item.name}</strong> - {item.description}
                        <div>Data utworzenia: {new Date(item.createdAt).toLocaleDateString()}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ApiTest;