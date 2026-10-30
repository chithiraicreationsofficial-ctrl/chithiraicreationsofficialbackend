const express = require("express");
const router = express.Router();
const { pool } = require("../config/postgres");
const Inquiry = require("../models/Inquiry");
const { adminAuth } = require("../middleware/auth");

// Clean phone helper: removes spaces, dashes, parentheses
const cleanPhone = (phone) => {
  if (!phone) return "";
  return String(phone).replace(/[\s\-\(\)\+]/g, "").trim();
};

// ========================================================
// 1. GET /api/inquiries
// List all inquiries with search, status & date filters
// ========================================================
router.get("/", async (req, res) => {
  try {
    const { search, status, startDate, endDate, sort = "desc" } = req.query;

    let usePostgres = !!process.env.PG_PASSWORD;
    let inquiries = [];

    if (usePostgres) {
      try {
        let whereClauses = [];
        let params = [];
        let paramIndex = 1;

        if (search && search.trim()) {
          const searchTerm = `%${search.trim()}%`;
          whereClauses.push(`(phone ILIKE $${paramIndex} OR name ILIKE $${paramIndex} OR notes ILIKE $${paramIndex})`);
          params.push(searchTerm);
          paramIndex++;
        }

        if (status && status.toUpperCase() !== "ALL") {
          whereClauses.push(`status = $${paramIndex}`);
          params.push(status.toUpperCase());
          paramIndex++;
        }

        if (startDate) {
          whereClauses.push(`created_at >= $${paramIndex}::timestamp`);
          params.push(`${startDate} 00:00:00`);
          paramIndex++;
        }

        if (endDate) {
          whereClauses.push(`created_at <= $${paramIndex}::timestamp`);
          params.push(`${endDate} 23:59:59`);
          paramIndex++;
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
        const orderSql = sort === "asc" ? "ORDER BY created_at ASC" : "ORDER BY updated_at DESC, created_at DESC";

        const query = `
          SELECT id, phone, name, status, call_count, notes, source, last_called_at, created_at, updated_at
          FROM inquiries
          ${whereSql}
          ${orderSql}
        `;

        const result = await pool.query(query, params);
        inquiries = result.rows;

        // Check if phone numbers are registered in diwali_registrations
        if (inquiries.length > 0) {
          const phones = inquiries.map((r) => r.phone);
          const regResult = await pool.query(
            `SELECT phone, registration_id, token, sweet_name, category, status 
             FROM diwali_registrations 
             WHERE phone = ANY($1::varchar[])`,
            [phones]
          );

          const regMap = {};
          regResult.rows.forEach((reg) => {
            regMap[reg.phone] = reg;
          });

          inquiries = inquiries.map((inq) => ({
            ...inq,
            diwaliRegistration: regMap[inq.phone] || null,
            isRegisteredUser: !!regMap[inq.phone] || inq.status === "REGISTERED",
          }));
        }
      } catch (pgError) {
        console.warn("Postgres query failed for inquiries, falling back to Mongo:", pgError.message);
        usePostgres = false;
      }
    }

    if (!usePostgres) {
      // MongoDB Fallback
      let query = {};
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), "i");
        query.$or = [{ phone: regex }, { name: regex }, { notes: regex }];
      }
      if (status && status.toUpperCase() !== "ALL") {
        query.status = status.toUpperCase();
      }
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
        if (endDate) query.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
      }

      const mongoInquiries = await Inquiry.find(query).sort({ updatedAt: -1, createdAt: -1 });
      inquiries = mongoInquiries.map((m) => ({
        id: m._id,
        phone: m.phone,
        name: m.name,
        status: m.status,
        call_count: m.callCount,
        notes: m.notes,
        source: m.source,
        last_called_at: m.lastCalledAt,
        created_at: m.createdAt,
        updated_at: m.updatedAt,
        isRegisteredUser: m.status === "REGISTERED",
      }));
    }

    return res.json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching inquiry list",
      error: error.message,
    });
  }
});

// ========================================================
// 2. GET /api/inquiries/stats
// Summary metrics: total calls, process, registered, completed
// ========================================================
router.get("/stats", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let usePostgres = !!process.env.PG_PASSWORD;

    if (usePostgres) {
      try {
        let dateFilter = "";
        let params = [];
        let paramIdx = 1;

        if (startDate) {
          dateFilter += ` AND created_at >= $${paramIdx}::timestamp`;
          params.push(`${startDate} 00:00:00`);
          paramIdx++;
        }
        if (endDate) {
          dateFilter += ` AND created_at <= $${paramIdx}::timestamp`;
          params.push(`${endDate} 23:59:59`);
          paramIdx++;
        }

        const statsQuery = `
          SELECT 
            COUNT(*)::int as total_inquiries,
            COALESCE(SUM(call_count), 0)::int as total_calls_came,
            COUNT(*) FILTER (WHERE status = 'INQUIRY')::int as total_inquiry,
            COUNT(*) FILTER (WHERE status = 'PROCESS')::int as total_process,
            COUNT(*) FILTER (WHERE status = 'REGISTERED')::int as total_registered,
            COUNT(*) FILTER (WHERE status = 'COMPLETED')::int as total_completed,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int as today_inquiries
          FROM inquiries
          WHERE 1=1 ${dateFilter}
        `;

        const result = await pool.query(statsQuery, params);
        const row = result.rows[0] || {};

        return res.json({
          success: true,
          stats: {
            totalInquiries: row.total_inquiries || 0,
            totalCallsCame: row.total_calls_came || 0,
            totalInquiry: row.total_inquiry || 0,
            totalProcess: row.total_process || 0,
            totalRegistered: row.total_registered || 0,
            totalCompleted: row.total_completed || 0,
            todayInquiries: row.today_inquiries || 0,
          },
        });
      } catch (pgError) {
        console.warn("Postgres stats failed, fallback to Mongo:", pgError.message);
        usePostgres = false;
      }
    }

    if (!usePostgres) {
      // MongoDB fallback stats
      let query = {};
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
        if (endDate) query.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
      }

      const all = await Inquiry.find(query);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = {
        totalInquiries: all.length,
        totalCallsCame: all.reduce((sum, item) => sum + (item.callCount || 1), 0),
        totalInquiry: all.filter((i) => i.status === "INQUIRY").length,
        totalProcess: all.filter((i) => i.status === "PROCESS").length,
        totalRegistered: all.filter((i) => i.status === "REGISTERED").length,
        totalCompleted: all.filter((i) => i.status === "COMPLETED").length,
        todayInquiries: all.filter((i) => new Date(i.createdAt) >= today).length,
      };

      return res.json({
        success: true,
        stats,
      });
    }
  } catch (error) {
    console.error("Error fetching inquiry stats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching stats",
      error: error.message,
    });
  }
});

// ========================================================
// 3. POST /api/inquiries
// Add new inquiry number or increment call if existing
// ========================================================
router.post("/", async (req, res) => {
  try {
    const { phone, name = "", notes = "", status = "INQUIRY", source = "Direct Call" } = req.body;

    const cleanedPhone = cleanPhone(phone);
    if (!cleanedPhone || cleanedPhone.length < 6) {
      return res.status(200).json({
        success: false,
        message: "Please enter a valid phone number (at least 6-10 digits).",
      });
    }

    const formattedStatus = ["INQUIRY", "PROCESS", "REGISTERED", "COMPLETED"].includes(
      String(status).toUpperCase()
    )
      ? String(status).toUpperCase()
      : "INQUIRY";

    let usePostgres = !!process.env.PG_PASSWORD;

    if (usePostgres) {
      try {
        // Check if phone already exists
        const existingResult = await pool.query(
          "SELECT * FROM inquiries WHERE phone = $1 LIMIT 1",
          [cleanedPhone]
        );

        if (existingResult.rows.length > 0) {
          const existing = existingResult.rows[0];
          const newCallCount = (existing.call_count || 1) + 1;
          const updatedName = name && name.trim() ? name.trim() : existing.name;
          const combinedNotes = notes && notes.trim()
            ? (existing.notes ? `${existing.notes}\n[${new Date().toLocaleDateString()}] ${notes.trim()}` : notes.trim())
            : existing.notes;

          const updateResult = await pool.query(
            `UPDATE inquiries 
             SET call_count = $1, 
                 name = $2, 
                 notes = $3, 
                 last_called_at = CURRENT_TIMESTAMP, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $4 
             RETURNING *`,
            [newCallCount, updatedName, combinedNotes, existing.id]
          );

          // Dual-save Mongo
          try {
            await Inquiry.findOneAndUpdate(
              { phone: cleanedPhone },
              {
                callCount: newCallCount,
                name: updatedName,
                notes: combinedNotes,
                lastCalledAt: new Date(),
              }
            );
          } catch (e) {}

          return res.json({
            success: true,
            isExisting: true,
            message: `Existing number found! Call count incremented to ${newCallCount}.`,
            data: updateResult.rows[0],
          });
        }

        // Check if this phone number is already registered in diwali_registrations
        const diwaliCheck = await pool.query(
          "SELECT registration_id, name, token, sweet_name, category FROM diwali_registrations WHERE phone = $1 LIMIT 1",
          [cleanedPhone]
        );

        const isDiwaliRegistered = diwaliCheck.rows.length > 0;
        const initialStatus = isDiwaliRegistered ? "REGISTERED" : formattedStatus;
        const callerName = name && name.trim() ? name.trim() : (isDiwaliRegistered ? diwaliCheck.rows[0].name : "");

        const insertResult = await pool.query(
          `INSERT INTO inquiries (phone, name, status, call_count, notes, source, last_called_at, created_at, updated_at)
           VALUES ($1, $2, $3, 1, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING *`,
          [cleanedPhone, callerName, initialStatus, notes.trim(), source || "Direct Call"]
        );

        // Dual-save Mongo
        try {
          await Inquiry.create({
            phone: cleanedPhone,
            name: callerName,
            status: initialStatus,
            callCount: 1,
            notes: notes.trim(),
            source: source || "Direct Call",
          });
        } catch (e) {}

        return res.json({
          success: true,
          isExisting: false,
          message: isDiwaliRegistered
            ? "Number added! Matched with an existing Diwali Registration."
            : "New inquiry added successfully with status 'Inquiry'.",
          data: insertResult.rows[0],
        });
      } catch (pgError) {
        console.warn("Postgres insert error, falling back to Mongo:", pgError.message);
        usePostgres = false;
      }
    }

    if (!usePostgres) {
      // MongoDB Fallback
      let existing = await Inquiry.findOne({ phone: cleanedPhone });
      if (existing) {
        existing.callCount += 1;
        existing.lastCalledAt = new Date();
        if (name && name.trim()) existing.name = name.trim();
        if (notes && notes.trim()) {
          existing.notes = existing.notes ? `${existing.notes}\n${notes.trim()}` : notes.trim();
        }
        await existing.save();
        return res.json({
          success: true,
          isExisting: true,
          message: `Existing caller found. Call count updated to ${existing.callCount}.`,
          data: existing,
        });
      }

      const newInquiry = await Inquiry.create({
        phone: cleanedPhone,
        name: name.trim(),
        status: formattedStatus,
        callCount: 1,
        notes: notes.trim(),
        source: source || "Direct Call",
      });

      return res.json({
        success: true,
        isExisting: false,
        message: "New inquiry added successfully with status 'Inquiry'.",
        data: newInquiry,
      });
    }
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating inquiry",
      error: error.message,
    });
  }
});

// ========================================================
// 4. PATCH /api/inquiries/:id/status
// Manual status change: INQUIRY, PROCESS, REGISTERED, COMPLETED
// ========================================================
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["INQUIRY", "PROCESS", "REGISTERED", "COMPLETED"];
    const formattedStatus = String(status || "").toUpperCase();

    if (!validStatuses.includes(formattedStatus)) {
      return res.status(200).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    let usePostgres = !!process.env.PG_PASSWORD;

    if (usePostgres) {
      try {
        const updateResult = await pool.query(
          `UPDATE inquiries 
           SET status = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2 
           RETURNING *`,
          [formattedStatus, id]
        );

        if (updateResult.rows.length === 0) {
          return res.status(200).json({
            success: false,
            message: "Inquiry not found",
          });
        }

        const updated = updateResult.rows[0];

        // Dual-update Mongo
        try {
          await Inquiry.findOneAndUpdate({ phone: updated.phone }, { status: formattedStatus });
        } catch (e) {}

        return res.json({
          success: true,
          message: `Status updated to ${formattedStatus}`,
          data: updated,
        });
      } catch (pgError) {
        console.warn("Postgres status update error, fallback to Mongo:", pgError.message);
        usePostgres = false;
      }
    }

    if (!usePostgres) {
      const updated = await Inquiry.findByIdAndUpdate(
        id,
        { status: formattedStatus },
        { new: true }
      );
      if (!updated) {
        return res.status(200).json({ success: false, message: "Inquiry not found" });
      }
      return res.json({
        success: true,
        message: `Status updated to ${formattedStatus}`,
        data: updated,
      });
    }
  } catch (error) {
    console.error("Error updating inquiry status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating status",
      error: error.message,
    });
  }
});

// ========================================================
// 5. POST /api/inquiries/:id/log-call
// Log an additional call from the same number
// ========================================================
router.post("/:id/log-call", async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    let usePostgres = !!process.env.PG_PASSWORD;

    if (usePostgres) {
      try {
        const existing = await pool.query("SELECT * FROM inquiries WHERE id = $1", [id]);
        if (existing.rows.length === 0) {
          return res.status(200).json({ success: false, message: "Inquiry not found" });
        }

        const row = existing.rows[0];
        const newCallCount = (row.call_count || 1) + 1;
        const newNotes = note && note.trim()
          ? (row.notes ? `${row.notes}\n[Call #${newCallCount} on ${new Date().toLocaleDateString()}] ${note.trim()}` : `[Call #${newCallCount}] ${note.trim()}`)
          : row.notes;

        const result = await pool.query(
          `UPDATE inquiries 
           SET call_count = $1, 
               notes = $2, 
               last_called_at = CURRENT_TIMESTAMP, 
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $3 
           RETURNING *`,
          [newCallCount, newNotes, id]
        );

        return res.json({
          success: true,
          message: `Logged call #${newCallCount} successfully!`,
          data: result.rows[0],
        });
      } catch (pgError) {
        console.warn("Postgres log-call error, fallback to Mongo:", pgError.message);
        usePostgres = false;
      }
    }

    if (!usePostgres) {
      const row = await Inquiry.findById(id);
      if (!row) return res.status(200).json({ success: false, message: "Inquiry not found" });
      row.callCount = (row.callCount || 1) + 1;
      row.lastCalledAt = new Date();
      if (note && note.trim()) {
        row.notes = row.notes ? `${row.notes}\n${note.trim()}` : note.trim();
      }
      await row.save();
      return res.json({
        success: true,
        message: `Logged call #${row.callCount} successfully!`,
        data: row,
      });
    }
  } catch (error) {
    console.error("Error logging call:", error);
    return res.status(500).json({
      success: false,
      message: "Server error logging call",
      error: error.message,
    });
  }
});

// ========================================================
// 6. PUT /api/inquiries/:id
// Edit inquiry full details
// ========================================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, name, status, notes, source, call_count } = req.body;

    const cleanedPhone = cleanPhone(phone);
    if (!cleanedPhone) {
      return res.status(200).json({ success: false, message: "Valid phone is required." });
    }

    let usePostgres = !!process.env.PG_PASSWORD;

    if (usePostgres) {
      try {
        const result = await pool.query(
          `UPDATE inquiries 
           SET phone = $1, 
               name = $2, 
               status = $3, 
               notes = $4, 
               source = $5, 
               call_count = COALESCE($6, call_count), 
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $7 
           RETURNING *`,
          [
            cleanedPhone,
            name || "",
            status || "INQUIRY",
            notes || "",
            source || "Direct Call",
            call_count ? parseInt(call_count) : null,
            id,
          ]
        );

        if (result.rows.length === 0) {
          return res.status(200).json({ success: false, message: "Inquiry not found" });
        }

        return res.json({
          success: true,
          message: "Inquiry updated successfully",
          data: result.rows[0],
        });
      } catch (pgError) {
        console.warn("Postgres update error, fallback to Mongo:", pgError.message);
        usePostgres = false;
      }
    }

    if (!usePostgres) {
      const updated = await Inquiry.findByIdAndUpdate(
        id,
        {
          phone: cleanedPhone,
          name: name || "",
          status: status || "INQUIRY",
          notes: notes || "",
          source: source || "Direct Call",
          callCount: call_count ? parseInt(call_count) : 1,
        },
        { new: true }
      );
      return res.json({
        success: true,
        message: "Inquiry updated successfully",
        data: updated,
      });
    }
  } catch (error) {
    console.error("Error editing inquiry:", error);
    return res.status(500).json({
      success: false,
      message: "Server error editing inquiry",
      error: error.message,
    });
  }
});

// ========================================================
// 7. DELETE /api/inquiries/:id
// Delete an inquiry
// ========================================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let usePostgres = !!process.env.PG_PASSWORD;

    if (usePostgres) {
      try {
        const result = await pool.query("DELETE FROM inquiries WHERE id = $1 RETURNING phone", [id]);
        if (result.rows.length === 0) {
          return res.status(200).json({ success: false, message: "Inquiry not found" });
        }

        try {
          await Inquiry.findOneAndDelete({ phone: result.rows[0].phone });
        } catch (e) {}

        return res.json({
          success: true,
          message: "Inquiry deleted successfully",
        });
      } catch (pgError) {
        console.warn("Postgres delete error, fallback to Mongo:", pgError.message);
        usePostgres = false;
      }
    }

    if (!usePostgres) {
      await Inquiry.findByIdAndDelete(id);
      return res.json({
        success: true,
        message: "Inquiry deleted successfully",
      });
    }
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting inquiry",
      error: error.message,
    });
  }
});

module.exports = router;
