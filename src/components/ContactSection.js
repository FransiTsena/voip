import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../baseUrl';
import { useSIP } from './SIPProvider';
import useStore from '../store/store';

const ContactSection = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [newContact, setNewContact] = useState({ name: '', email: '', phone: '' });
    const [showAddContactPopup, setShowAddContactPopup] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const sip = useSIP() || {};
    const { makeCall } = sip;
    const agent = useStore(state => state.agent);
    const agentId = agent?._id || agent?.id;

    useEffect(() => {
        const fetchContacts = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${baseUrl}/contacts`, {
                    params: { agentId },
                    withCredentials: true,
                });
                setContacts(response.data.contacts);
            } catch (err) {
                setError('Failed to load contacts: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchContacts();
    }, []);

    const handleCreateContact = async (contact) => {
        try {
            const response = await axios.post(`${baseUrl}/contacts`, { ...contact, agentId }, {
                withCredentials: true,
            });
            setContacts([...contacts, response.data]);
            setNewContact({ name: '', email: '', phone: '' }); // Reset form
        } catch (err) {
            setError('Failed to create contact: ' + err.message);
        }
    };

    const handleDeleteContact = async (contactId) => {
        try {
            await axios.delete(`${baseUrl}/contacts/${contactId}`, {
                withCredentials: true,
            });
            setContacts(contacts.filter(contact => contact._id !== contactId));
        } catch (err) {
            setError('Failed to delete contact: ' + err.message);
        }
    };

    const handleCallContact = (phoneNumber) => {
        // Assuming makeCall is available from SIP context
        if (typeof makeCall === 'function') {
            makeCall(phoneNumber);
        } else {
            setError('SIP is not ready for making calls.');
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-3xl font-extrabold text-indigo-800 mb-4">Contacts</h2>
                {loading ? (
                    <div className="text-indigo-600 font-semibold flex items-center justify-center">
                        <span className="material-icons animate-spin text-4xl">refresh</span>
                        <span className="ml-2">Loading...</span>
                    </div>
                ) : error ? (
                    <div className="text-red-600 font-semibold flex items-center justify-center">
                        <span className="material-icons text-4xl">error</span>
                        <span className="ml-2">{error}</span>
                    </div>
                ) : contacts.length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2 bg-gray-200 p-3 rounded-lg">
                            <span className="material-icons text-gray-500">search</span>
                            <input
                                type="text"
                                placeholder="Search Contacts"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 bg-transparent focus:outline-none"
                            />
                        </div>
                        <ul className="space-y-4">
                            {contacts
                                .filter(contact =>
                                    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    contact.phone.includes(searchQuery)
                                )
                                .map((contact) => (
                                    <li key={contact._id} className="p-4 bg-gray-50 rounded-xl shadow-md border border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <span className="material-icons text-indigo-500 text-4xl">person</span>
                                            <div>
                                                <div className="font-bold text-gray-700 text-lg">{contact.name}</div>
                                                <div className="text-sm text-gray-500">{contact.email || 'No email provided'}</div>
                                                <div className="text-sm text-gray-500">{contact.phone}</div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center space-x-2 hover:bg-green-600 transition" onClick={() => handleCallContact(contact.phone)}>
                                                <span className="material-icons">call</span>
                                                <span>Call</span>
                                            </button>
                                            <button className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center space-x-2 hover:bg-red-600 transition" onClick={() => handleDeleteContact(contact._id)}>
                                                <span className="material-icons">delete</span>
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    </div>
                ) : (
                    <div className="text-gray-400 flex items-center justify-center">
                        <span className="material-icons text-4xl">info</span>
                        <span className="ml-2">No contacts available</span>
                    </div>
                )}
                {showAddContactPopup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                            <h3 className="text-xl font-bold flex items-center space-x-2">
                                <span className="material-icons">person_add</span>
                                <span>Add New Contact</span>
                            </h3>
                            <input
                                type="text"
                                placeholder="Name"
                                value={newContact.name}
                                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={newContact.email}
                                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                                type="text"
                                placeholder="Phone"
                                value={newContact.phone}
                                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex space-x-4">
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition"
                                    onClick={() => {
                                        handleCreateContact(newContact);
                                        setShowAddContactPopup(false);
                                    }}
                                >
                                    <span className="material-icons">save</span>
                                    <span>Save</span>
                                </button>
                                <button
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg flex items-center space-x-2 hover:bg-gray-600 transition"
                                    onClick={() => setShowAddContactPopup(false)}
                                >
                                    <span className="material-icons">cancel</span>
                                    <span>Cancel</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition fixed bottom-6 right-6"
                    onClick={() => setShowAddContactPopup(true)}
                >
                    <span className="material-icons text-2xl">add</span>
                </button>
            </div>
        </div>
    );
};

export default ContactSection;
