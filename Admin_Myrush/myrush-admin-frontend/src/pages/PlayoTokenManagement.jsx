import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { playoTokensApi } from '../services/adminApi';

const PlayoTokenManagement = () => {
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newToken, setNewToken] = useState(null);
    const [showToken, setShowToken] = useState(false);
    const [tokenDescription, setTokenDescription] = useState('Playo Production Token');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchTokens();
    }, []);

    const fetchTokens = async () => {
        try {
            setLoading(true);
            const response = await playoTokensApi.getAll();
            setTokens(response.data.tokens || []);
        } catch (error) {
            console.error('Error fetching tokens:', error);
            setTokens([]);
        } finally {
            setLoading(false);
        }
    };

    const generateToken = async () => {
        try {
            setLoading(true);
            const response = await playoTokensApi.generate(tokenDescription);
            setNewToken(response.data.token);
            setShowToken(true);
            await fetchTokens();
        } catch (error) {
            console.error('Error generating token:', error);
            alert('Error generating token. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const deactivateToken = async (tokenId) => {
        try {
            await playoTokensApi.deactivate(tokenId);
            await fetchTokens();
        } catch (error) {
            console.error('Error deactivating token:', error);
        }
    };

    const activateToken = async (tokenId) => {
        try {
            await playoTokensApi.activate(tokenId);
            await fetchTokens();
        } catch (error) {
            console.error('Error activating token:', error);
        }
    };

    const deleteToken = async (tokenId) => {
        if (!window.confirm('Are you sure you want to permanently delete this token?')) return;

        try {
            await playoTokensApi.delete(tokenId);
            await fetchTokens();
        } catch (error) {
            console.error('Error deleting token:', error);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Layout>
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-semibold text-black dark:text-white">
                        Playo API Token Management
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Manage API tokens for Playo integration
                    </p>
                </div>

                {/* Generate New Token Card */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                    <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Generate New Token
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Create a new API token for Playo integration. Old tokens with the same description will be deactivated.
                        </p>
                    </div>
                    <div className="p-6.5">
                        <div className="mb-4 flex gap-4">
                            <input
                                type="text"
                                placeholder="Token Description"
                                value={tokenDescription}
                                onChange={(e) => setTokenDescription(e.target.value)}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            />
                            <button
                                onClick={generateToken}
                                disabled={loading}
                                className="inline-flex items-center justify-center rounded-md bg-primary py-3 px-6 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 whitespace-nowrap"
                            >
                                {loading ? 'Generating...' : 'Generate Token'}
                            </button>
                        </div>

                        {newToken && (
                            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
                                <p className="font-semibold text-yellow-800 mb-3">
                                    ⚠️ Save this token now! It won't be shown again.
                                </p>
                                <div className="flex items-center gap-2 bg-white p-3 rounded border mb-3">
                                    <code className="flex-1 text-sm font-mono break-all">
                                        {showToken ? newToken : '••••••••••••••••••••••••••••••••'}
                                    </code>
                                    <button
                                        onClick={() => setShowToken(!showToken)}
                                        className="p-2 hover:bg-gray-100 rounded"
                                        title={showToken ? 'Hide' : 'Show'}
                                    >
                                        {showToken ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(newToken)}
                                        className="p-2 hover:bg-gray-100 rounded"
                                        title="Copy"
                                    >
                                        {copied ? '✅' : '📋'}
                                    </button>
                                </div>
                                <div className="text-sm text-gray-700">
                                    <p className="font-medium mb-1">Authorization Header:</p>
                                    <code className="block p-2 bg-gray-100 rounded text-xs break-all">
                                        Authorization: Bearer {newToken}
                                    </code>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Existing Tokens Card */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
                    <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex items-center justify-between">
                        <h3 className="font-medium text-black dark:text-white">
                            Existing Tokens
                        </h3>
                        <button
                            onClick={fetchTokens}
                            className="text-sm text-primary hover:underline"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                    <div className="p-6.5">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading tokens...</div>
                        ) : tokens.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No tokens found. Generate your first token above.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tokens.map((token) => (
                                    <div
                                        key={token.id}
                                        className="flex items-center justify-between p-4 border border-stroke rounded-lg dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-medium text-black dark:text-white">
                                                    {token.description}
                                                </h4>
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${token.is_active
                                                        ? 'bg-success bg-opacity-10 text-success'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                >
                                                    {token.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <p>
                                                    Token Preview:{' '}
                                                    <code className="bg-gray-100 dark:bg-meta-4 px-2 py-0.5 rounded">
                                                        {token.token_preview}
                                                    </code>
                                                </p>
                                                <p>Created: {new Date(token.created_at).toLocaleString()}</p>
                                                {token.last_used_at && (
                                                    <p>Last Used: {new Date(token.last_used_at).toLocaleString()}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            {token.is_active ? (
                                                <button
                                                    onClick={() => deactivateToken(token.id)}
                                                    className="inline-flex items-center justify-center rounded-md border border-stroke py-2 px-4 text-center font-medium hover:shadow-1 dark:border-strokedark"
                                                >
                                                    Deactivate
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => activateToken(token.id)}
                                                    className="inline-flex items-center justify-center rounded-md border border-stroke py-2 px-4 text-center font-medium hover:shadow-1 dark:border-strokedark"
                                                >
                                                    Activate
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteToken(token.id)}
                                                className="inline-flex items-center justify-center rounded-md bg-danger py-2 px-4 text-center font-medium text-white hover:bg-opacity-90"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Information Card */}
                <div className="rounded-sm border border-stroke bg-blue-50 dark:bg-boxdark shadow-default dark:border-strokedark">
                    <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                        <h3 className="font-medium text-blue-900 dark:text-white">
                            Integration Information
                        </h3>
                    </div>
                    <div className="p-6.5 text-sm text-blue-800 dark:text-gray-300 space-y-2">
                        <p><strong>Base URL:</strong> http://65.0.195.149:8000/api/playo</p>
                        <p><strong>Authentication:</strong> Bearer token in Authorization header</p>
                        <p><strong>Token Persistence:</strong> Tokens are stored in the database and persist across app restarts</p>
                        <p><strong>Security:</strong> Only hashed tokens are stored. The actual token is shown only once during generation.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PlayoTokenManagement;
