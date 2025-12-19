// complaint

const mongoose = require("mongoose");
const complaintSchema = require("./complaint.schema");
const attachComplaintMethods = require("./complaint.methods");

attachComplaintMethods(complaintSchema);

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;
