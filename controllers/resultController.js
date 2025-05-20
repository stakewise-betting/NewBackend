import ResultModel from "../models/results.js";

export const saveResult = async (req, res) => {
  try {
    const { eventId, name, category, winner, prizepool } = req.body;

    // Validate required fields
    if (!eventId || !name || !category || !winner || prizepool === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if result already exists
    const existingResult = await ResultModel.findOne({ eventId });
    if (existingResult) {
      return res
        .status(409)
        .json({ error: "Result for this event already exists" });
    }

    // Create new result
    const result = new ResultModel({
      eventId,
      name,
      category,
      winner,
      prizepool,
    });

    const savedResult = await result.save();
    res.status(201).json(savedResult);
  } catch (error) {
    console.error("Error saving result:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "Result for this event already exists" });
    }
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getAllResults = async (req, res) => {
  try {
    const results = await ResultModel.find().sort({ releasedAt: -1 });
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getResultByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await ResultModel.findOne({ eventId: Number(eventId) });

    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching result:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};