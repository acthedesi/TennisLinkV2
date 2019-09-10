var mongoose = require("mongoose");

var freeTimeSchema = new mongoose.Schema({
	mondayFreeTimes: [[String]],
	tuesdayFreeTimes: [[String]],
	wednesdayFreeTimes: [[String]],
	thursdayFreeTimes: [[String]],
	fridayFreeTimes: [[String]],
	saturdayFreeTimes: [[String]],
	sundayFreeTimes: [[String]],
	username: String,
	id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}
});

module.exports = mongoose.model("freeTime", freeTimeSchema);