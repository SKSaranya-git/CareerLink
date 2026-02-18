import api from "./axios";

export const getMyApplications = async () => {
    const { data } = await api.get("/applications/my-applications");
    return data;
};

export const updateApplicationStatus = async (id, status) => {
    const { data } = await api.put(`/applications/${id}/status`, { status });
    return data;
};

export const getApplicationsForJob = async (jobId) => {
    const { data } = await api.get(`/jobs/${jobId}/applications`);
    return data;
};
