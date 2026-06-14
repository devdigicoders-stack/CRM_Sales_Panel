import axiosInstance from "./axiosInstance";

export const leadAPI = {
  getAllLeads: async (params = {}) => {
    const response = await axiosInstance.get("/leads", { params });
    return response.data;
  },

  getLeadById: async (id) => {
    const response = await axiosInstance.get(`/leads/${id}`);
    return response.data;
  },

  updateLead: async (id, data) => {
    const response = await axiosInstance.put(`/leads/${id}`, data);
    return response.data;
  },

  addRemark: async (id, data) => {
    const response = await axiosInstance.post(`/leads/${id}/remarks`, data);
    return response.data;
  },

  addLeadRemark: async (id, remarkData) => {
    const response = await axiosInstance.post(`/leads/${id}/remarks`, remarkData);
    return response.data;
  },

  scheduleMeeting: async (id, data) => {
    const response = await axiosInstance.post(`/leads/${id}/meetings`, data);
    return response.data;
  },

  updateMeeting: async (id, meetingId, data) => {
    const response = await axiosInstance.put(`/leads/${id}/meetings/${meetingId}`, data);
    return response.data;
  },

  addSaleDetails: async (id, data) => {
    const response = await axiosInstance.put(`/leads/${id}`, data);
    return response.data;
  },

  confirmSale: async (id, data) => {
    const response = await axiosInstance.post(`/leads/${id}/confirm-sale`, data);
    return response.data;
  },

  updateDelivery: async (id, data) => {
    const response = await axiosInstance.put(`/leads/${id}/delivery`, data);
    return response.data;
  },

  uploadSaleDocuments: async (id, agreementFile) => {
    const formData = new FormData();
    formData.append('agreement', agreementFile);
    const response = await axiosInstance.put(`/leads/${id}/sale-documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  transferToAccounts: async (id) => {
    const response = await axiosInstance.put(`/leads/${id}/transfer-to-accounts`, {});
    return response.data;
  },

  createLead: async (data) => {
    const response = await axiosInstance.post("/leads", data);
    return response.data;
  },

  getSalesUsers: async () => {
    const response = await axiosInstance.get("/users?role=sales");
    return response.data;
  },

  getSettings: async () => {
    const response = await axiosInstance.get("/settings");
    return response.data;
  },
};
