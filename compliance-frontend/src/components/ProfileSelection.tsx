"use client";


import { useEffect, useState } from "react";
import Link from "next/link";



export default function ProfileSelection() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
    const [profileName, setProfileName] = useState("");
    const [profiles, setProfiles] = useState<string[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<string | null>(null); // State for selected profile

    const openCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setProfileName(""); // Reset the profile name when modal is closed
    };

    const openSelectModal = () => {
        setIsSelectModalOpen(true);
    };

    const closeSelectModal = () => {
        setIsSelectModalOpen(false);
    };

    const handleCreateProfile = async () => {
        if (profileName.trim()) {
            try {
                const response = await fetch("http://localhost:5001/api/create-folder", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ profile_name: profileName }),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(data.message); // Handle success message
                    closeCreateModal();
                    fetchProfiles(); // Fetch profiles again after creation
                    window.location.href = `/inspec-compliance?profile=${encodeURIComponent(profileName)}`; // Redirect after creation

                } else {
                    const errorData = await response.json();
                    alert(errorData.error); // Handle error message
                }
            } catch (error) {
                console.error("Error creating profile:", error);
                alert("An error occurred while creating the profile.");
            }
        } else {
            alert("Please enter a valid profile name.");
        }
    };

    const fetchProfiles = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/fetch-folders");
            if (response.ok) {
                const data = await response.json();
                setProfiles(data); // Set the profiles in state
                console.log(data)
            } else {
                const errorData = await response.json();
                console.error(errorData.error); // Handle error
            }
        } catch (error) {
            console.error("Error fetching profiles:", error);
        }
    };

    const handleSelectProfile = () => {
        if (selectedProfile) {
            // Pass the selected profile to the InspecComplianceComponent
            // Implement any additional logic here as needed, e.g., navigating to another page
            console.log("Selected Profile:", selectedProfile);
            // For example, you could redirect or update a state to display the InspecComplianceComponent
            closeSelectModal();
        } else {
            alert("Please select a profile.");
        }
    };

    useEffect(() => {
        fetchProfiles(); // Fetch profiles on component mount
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center gap-8 p-8">
            <h1 className="text-3xl font-bold mb-4">Welcome! Choose an Option:</h1>
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Option to Select Existing Profile */}
                <button
                    onClick={openSelectModal}
                    className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
                >
                    Select from Existing Profiles
                </button>
                {/* Option to Create New Profile */}
                <button
                    onClick={openCreateModal}
                    className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 text-center"
                >
                    Create New Profile
                </button>
            </div>

            {/* Modal for Selecting Profiles */}
            {isSelectModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg w-80">
                        <h2 className="text-xl font-bold mb-4">Select a Profile</h2>
                        <ul className="list-disc pl-5 mb-4">
                            {profiles.map((profile, index) => (
                                <li key={index} className="text-lg">
                                    <label>
                                        <input
                                            type="radio"
                                            value={profile}
                                            checked={selectedProfile === profile}
                                            onChange={() => setSelectedProfile(profile)}
                                            className="mr-2"
                                        />
                                        {profile}
                                    </label>
                                </li>
                            ))}
                        </ul>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={closeSelectModal}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            {/* <button
                                onClick={handleSelectProfile}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Select
                            </button> */}
                            <Link
                                href={`/inspec-compliance?profile=${encodeURIComponent(selectedProfile)}`}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Select Profile
                            </Link>

                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Creating Profile */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg w-80">
                        <h2 className="text-xl font-bold mb-4">Enter Profile Name</h2>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border rounded mb-4"
                            placeholder="Profile Name"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={closeCreateModal}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateProfile}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
