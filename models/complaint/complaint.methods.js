// complaint

const fs = require("fs").promises;
const path = require("path");
const logger = require("../../utils/logging/logger");

function attachComplaintMethods(schema) {
  // status update
  schema.methods.updateStatus = async function (newStatus, userId, note) {
    const validStatuses = [
      "pending",
      "in_progress",
      "resolved",
      "rejected",
      "closed",
    ];
    if (!validStatuses.includes(newStatus)) {
      throw new Error("Invalid status");
    }

    const previousStatus = this.status;
    this.status = newStatus;

    this.statusHistory.push({
      previousStatus,
      newStatus,
      changedBy: userId,
      note,
    });

    if (newStatus === "resolved") {
      this.resolvedAt = new Date();
      this.resolvedBy = userId;
    }

    if (newStatus === "rejected") {
      this.rejectedAt = new Date();
      this.rejectedBy = userId;
      this.rejectionReason = note || this.rejectionReason;
    }

    if (newStatus === "closed") {
      this.isActive = false;
    }

    await this.save();
    return this;
  };

  // add comment
  schema.methods.addComment = async function (userId, text, isStaffComment) {
    const comment = {
      user: userId,
      text,
      isStaffComment: !!isStaffComment,
    };

    this.comments.push(comment);
    await this.save();
    return this.comments[this.comments.length - 1];
  };

  // remove attachment files
  schema.methods.removeAttachmentFiles = async function () {
    if (!Array.isArray(this.attachments) || this.attachments.length === 0) {
      return;
    }

    for (const attachment of this.attachments) {
      try {
        if (attachment.path) {
          await fs.unlink(attachment.path);
        } else if (attachment.filename) {
          const filePath = path.join(
            process.cwd(),
            "uploads",
            "complaints",
            attachment.filename
          );
          await fs.unlink(filePath);
        }
      } catch (err) {
        logger.warn(
          `Failed to remove attachment file for complaint ${this._id}: ${err.message}`
        );
      }
    }
  };
}

module.exports = attachComplaintMethods;
