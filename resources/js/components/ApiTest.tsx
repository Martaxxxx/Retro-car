import React, { useState } from 'react';
import projectsService from '../services/projects.service';

export const ApiTest: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const testConnection = async () => {
        setLoading(true);
        setError(null);
        try {
            const projects = await projectsService.getProjects();
            setData(projects);
        } catch (err: any) {
            setError(err.message || 'Connection failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl mb-4">API Connection Test</h2>

            <button
                onClick={testConnection}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded"
            >
                {loading ? 'Testing...' : 'Test API Connection'}
            </button>

            {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                    Error: {error}
                </div>
            )}

            {data && (
                <div className="mt-4 p-4 bg-green-100 rounded">
                    <h3 className="font-bold">Success! Data received:</h3>
                    <pre className="mt-2 text-sm">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};