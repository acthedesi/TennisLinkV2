var mongoose = require("mongoose");

var userDataSchema = new mongoose.Schema({
	first_name: String,
	last_name: String,
	age: String,
	UTR: String, 
	NTRP: String,
	username: String,
	phone: String,
	address: String,
	city: String,
	state: String,
	zip: String,
	id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}
});

module.exports = mongoose.model("UserData", userDataSchema);