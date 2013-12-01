/**
 * =================
 * MODULE - Services
 * =================
 * REST and local services
 */

var	logger = require("./logger");
var	bcrypt = require('bcrypt'),
	SALT_WORK_FACTOR = 10;

module.exports = function(mongoose, modelUser, modelModel, modelComment, modelFile) {

	function error(code, resp) {
		var result = {};
		result.error = {};
		result.error.code = code;
		result.status = 'nok';

		switch(code) {
			case 0:
				result.error.msg = "Couldn't parse the JSON";
				break;
			case 1:
				result.error.msg = "Unsupported HTTP/1.1 method for this service";
				break;
			case 2:
				result.error.msg = "DB error";
				break;
			default:
				result.error.msg = "Unknow error";
		}

		logger.error("Error function with message : " + result.error.msg)
		var jsonResult = JSON.stringify(result);
			resp.end(jsonResult);
	}

	// Adds the header indicating all went sucessfully.
	function writeHeaders(resp) {
		resp.header("Access-Control-Allow-Origin","*");
	}

	function parseRequest(req, names) {
		request = {}
		for (var n in names) {
			request[names[n]] = req.param(names[n], null);
		}
		return request;
	}



	/*
	 * ------------------------------------------
	 * USERS Services
	 * ------------------------------------------
	 */
	 
	/**
	 * Create a user (only if her/his username is unique).
	 * @param {string} username - User username
	 * @param {string} password - Password
	 * @param {string} email - Email
	 * @param {Function(string, bool)} cb - Callback(error, status)
	 */
	function createUser(username, password, email, cb) {
		modelUser.findOne({ username: username }, function(err, user) {
			if (err || user) return cb(err, user); // User already exists
			
			var user = new modelUser({username: username, password: password, email: email});
			user.save(function(err) {
				cb (err, 'ok');
			});
		});
	}
	/**
	 * REST Service - CreateUser
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- username - 	User username 	- required
	 *		- password -  	Password 		- required
	 *		- email -  		Email 			- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceCreateUser(req, resp) {
		logger.info("<Service> CreateUser.");
		var userData = parseRequest(req, ['username', 'password', 'email']);
		
		writeHeaders(resp);
		createUser(userData.username, userData.password, userData.email, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}
	 
	/**
	 * Returns a list of users, ordered by username.
	 * @param {int} limit - Number max of users to return
	 * @param {int} offset - Number of the user to start with
	 * @param {Function(string, User[]} cb - Callback(error, User[])(error, User[])
	 */
	function getUsers(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelUser.find({}, {__v:0, _id:0}).sort({username: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelUser.find({}, {__v:0, _id:0}).sort({username: 1}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * REST Service - GetUsers
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the user to start with	- optional
	 */
	function serviceGetUsers(req, resp) {
		logger.info("<Service> GetUsers.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getUsers(getData.limit, getData.offset, function (err, users) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ users: users })); 
		});
	}



	/*
	 * ------------------------------------------
	 * USER Services
	 * ------------------------------------------
	 */
	 
	/**
	 * Returns the User corresponding to the given userusername
	 * @param {string} username - Username
	 * @param {Function(string, User)} cb - Callback(error, User)
	 */
	function getUser(username, cb) {
		modelUser.findOne({username: username}, {__v:0, _id:0}).lean().exec(cb);
	}
	/**
	 * REST Service - GetUser
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- username (string)		Username
	 */
	function serviceGetUser(req, resp) {
		logger.info("<Service> GetUser.");
		var getData = parseRequest(req, ['username']);
		
		writeHeaders(resp);
		getUser(getData.username, function (err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify(user)); 
		});
	}
	 
	/**
	 * Returns the User's id
	 * @param {string} username -  Username
	 * @param {Function(string, User)} cb -	Callback(error, User)
	 */
	function getUserId(username, cb) {
		modelUser.findOne({username: username}).select('_id').lean().exec(cb);
	}
	/**
	 * REST Service - GetUserId
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- username (string)		Username
	 */
	function serviceGetUserId(req, resp) {
		logger.info("<Service> GetUserId.");
		var getData = parseRequest(req, ['username']);
		
		writeHeaders(resp);
		getUserId(getData.username, function (err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ id: user._id })); 
		});
	}
	 
	/**
	 * Returns the User's email
	 * @param {string} username - Username
	 * @param {Function(string, User)} cb -	Callback(error, User)
	 */
	function getUserEmail(username, cb) {
		modelUser.findOne({username: username}).select('email').lean().exec(cb);
	}
	/**
	 * REST Service - GetUserEmail
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- username (string)		Username
	 */
	function serviceGetUserEmail(req, resp) {
		logger.info("<Service> GetUserEmail.");
		var getData = parseRequest(req, ['username']);
		
		writeHeaders(resp);
		getUserEmail(getData.username, function (err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ email: user.email })); 
		});
	}
	 
	/**
	 * Delete the User corresponding to the given username
	 * @param {string} username - Username
	 * @param {Function(string, User)} cb - Callback(error, User)
	 */
	function deleteUser(username, cb) {
		modelUser.findOne({username: username}).exec(function (err, item) {
			if (err){
				cb(err, null);
			}
              else {
					modelUser.remove(item, function (err, result) {
						cb(err, result);
					});
              }
       });
	}
	/**
	 * REST Service - DeleteUser
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- username (string)		Username
	 */
	function serviceDeleteUser(req, resp) {
		logger.info("<Service> DeleteUser.");
		var getData = parseRequest(req, ['username']);
		
		writeHeaders(resp);
		deleteUser(getData.username, function (err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
	
	
	/**
	 * Update the User corresponding to the given username
	 * @param {string} username - Username
	 * @param {string} password - Password
	 * @param {string} email - Email
	 * @param {Function(string, User)} cb - Callback(error, User)
	 */ 
	function updateUser(username, password, email, cb) {
		// generate a salt
		bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			if (err) { logger.error(err); return cb(err, null); }

			// hash the password using our new salt
			bcrypt.hash(password, salt, function(err, hash) {
				if (err) { logger.error(err); return cb(err, null); }

				modelUser.update({ username: username }, {password: hash, email: email}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
				});
			});
		});	
	}
	/**
	 * REST Service - UpdateUser
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- username (string)		Username
	 *		- password -  	Password 	- required
	 *		- email -  		Email 		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateUser(req, resp) {
		logger.info("<Service> UpdateUser.");
		var userData = parseRequest(req, ['username', 'password', 'email']);
		
		writeHeaders(resp);
		updateUser(userData.username, userData.password, userData.email, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
	
	
	/**
	 * Update the email of the User corresponding to the given username
	 * @param {string} username - Username
	 * @param {string} email -Email to change
	 * @param {Function(string, User)} cb - Callback(error, User)
	 */ 
	function updateUserEmail(username, email, cb) {
			modelUser.update({ username: username }, {email: email}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * REST Service - UpdateUserEmail
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- username (string)		Username
	 *		- email -  		Email 		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateUserEmail(req, resp) {
		logger.info("<Service> UpdateUserEmail.");
		var userData = parseRequest(req, ['username', 'email']);
		
		writeHeaders(resp);
		updateUserEmail(userData.username, userData.email, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
	
	
	/**
	 * Update the password of the User corresponding to the given username
	 * @param {string} username - Username
	 * @param {string} password - Password to change
	 * @param {Function(string, User)} cb - Callback(error, User)
	 */ 
	function updateUserPassword(username, password, cb) {
		// generate a salt
		bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			if (err) { logger.error(err); return cb(err, null); }

			// hash the password using our new salt
			bcrypt.hash(password, salt, function(err, hash) {
				if (err) { logger.error(err); return cb(err, null); }

				modelUser.update({ username: username }, {password: hash}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
				});
			});
		});
	}
	/**
	 * REST Service - UpdateUserPassword
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- username (string)		Username
	 *		- email -  		Email 		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateUserPassword(req, resp) {
		logger.info("<Service> UpdateUserPassword.");
		var userData = parseRequest(req, ['username', 'password']);
		
		writeHeaders(resp);
		updateUserPassword(userData.username, userData.password, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
	 
	 
	/*
	 * ------------------------------------------
	 * MODELS Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createModel
	 * Create a Model
	 * @param {string} name -  			Model name
	 * @param {string} file -  			Filename
	 *  - creator - 			Username of the Creator
	 * @param {string} creationDate (Date): 		Date of creation
	 *  - thumbnail - 		Filename of the thumbnail
	 * @param {string} tags (String[]): 			Tags (optional)
	 * @param {string} cb (Function(bool)):		Callback(error, User[])
	 */
	function createModel(name, file, creator, creationDate, thumbnail, tags, cb) {
		var obj = new modelModel({name: name, file: file, creator: creator,  creationDate: creationDate,  thumbnail: thumbnail,  tags: tags});
		obj.save(function(err) {
			cb (err, obj);
		});
	}
	/**
	 * REST Service - CreateModel
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *	- name -  			Model name					- required
	 *	- file -  			Filename					- required
	 *  - creator - 			Username of the Creator		- required
	 *	- creationDate (Date): 		Date of creation			- required
	 *  - thumbnail - 		Filename of the thumbnail	- required
	 *	- tags (String[]): 			Tags (optional)				- optional
	 */
	function serviceCreateModel(req, resp) {
		logger.info("<Service> CreateModel.");
		var objectsData = parseRequest(req, ['name', 'file', 'creator', 'creationDate', 'thumbnail', 'tags']);
		
		writeHeaders(resp);
		createModel(objectsData.name, objectsData.file, objectsData.creator, objectsData.creationDate, objectsData.thumbnail, objectsData.tags, function(err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}
	 
	/**
	 * getModels
	 * Returns a list of models, ordered by name.
	 * @param {string} limit (int): 					Number max of Model to return
	 * @param {string} offset (int): 				Number of the Model to start with
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function getModels(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelModel.find({}, {__v:0}).sort({name: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelModel.find({}, {__v:0}).sort({name: 1}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * REST Service - GetModels
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *		- limit (int): 		Number max to return					- optional
	 *		- offset (int): 	Number of the Model to start with	- optional
	 */
	function serviceGetModels(req, resp) {
		logger.info("<Service> GetModels.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getModels(getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ objects: objects })); 
		});
	}



	/*
	 * ------------------------------------------
	 * MODEL Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getModel
	 * Returns the Model corresponding to the given id
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function getModel(id, cb) {
		modelModel.findById(id, {__v:0}).lean().exec(cb);
	}
	/**
	 * REST Service - GetModel
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		Model
	 */
	function serviceGetModel(req, resp) {
		logger.info("<Service> GetModel.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModel(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify(obj)); 
		});
	}
	 
	/**
	 * getModelName
	 * Returns the Model's name
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function getModelName(id, cb) {
		modelModel.findById(id).select('_id').lean().exec(cb);
	}
	/**
	 * REST Service - GetModelName
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetModelName(req, resp) {
		logger.info("<Service> GetModelName.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelName(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ name: obj.name })); 
		});
	}
	 
	/**
	 * getModelFile
	 * Returns the Model's file
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function getModelFile(id, cb) {
		modelModel.findById(id).select('file').lean().exec(cb);
	}
	/**
	 * REST Service - GetModelFile
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetModelFile(req, resp) {
		logger.info("<Service> GetModelFile.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelFile(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ file: obj.file })); 
		});
	}
	 
	/**
	 * getModelCreator
	 * Returns the Model's file
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function getModelCreator(id, cb) {
		modelModel.findById(id).select('creator').lean().exec(cb);
	}
	/**
	 * REST Service - GetModelCreator
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetModelCreator(req, resp) {
		logger.info("<Service> GetModelCreator.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelCreator(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({creator: obj.creator })); 
		});
	}
	 
	/**
	 * getModelCreationDate
	 * Returns the Model's creation date
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function getModelCreationDate(id, cb) {
		modelModel.findById(id).select('creationDate').lean().exec(cb);
	}
	/**
	 * REST Service - GetModelCreationDate
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetModelCreationDate(req, resp) {
		logger.info("<Service> GetModelCreationDate.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelCreationDate(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({creationDate: obj.creationDate})); 
		});
	}
 
	/**
	 * getModelThumbnail
	 * Returns the Model's creation date
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function getModelThumbnail(id, cb) {
		modelModel.findById(id).select('thumbnail').lean().exec(cb);
	}
	/**
	 * REST Service - GetModelThumbnail
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetModelThumbnail(req, resp) {
		logger.info("<Service> GetModelThumbnail.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelThumbnail(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({thumbnail: obj.thumbnail})); 
		});
	}

	/**
	 * getModelTags
	 * Returns the Model's tags
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function getModelTags(id, cb) {
		modelModel.findById(id).select('tags').lean().exec(cb);
	}
	/**
	 * REST Service - GetModelTags
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetModelTags(req, resp) {
		logger.info("<Service> GetModelTags.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelTags(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({tags: obj.tags})); 
		});
	}
	 
	/**
	 * deleteModel
	 * Delete the Model corresponding to the given ID
	 * @param {string} id -  						ID
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function deleteModel(id, cb) {
		modelModel.findById(id).exec(function (err, item) {
			if (err){
				cb(err, null);
			}
              else {
					modelModel.remove(item, function (err, result) {
						cb(err, result);
					});
              }
       });
	}
	/**
	 * REST Service - DeleteModel
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceDeleteModel(req, resp) {
		logger.info("<Service> DeleteModel.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		deleteModel(getData.id, function (err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
		
	/**
	 * updateModel
	 * Update the Model corresponding to the given ID
	 * @param {string} id -  				ID
	 * @param {string} name -  			Model name
	 * @param {string} file -  			Filename
	 *  - creator - 			Username of the Creator
	 * @param {string} creationDate (Date): 		Date of creation
	 *  - thumbnail - 		Filename of the thumbnail
	 * @param {string} tags (String[]): 			Tags (optional)
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */ 
	function updateModel(id, name, file, creator, creationDate, thumbnail, tags, cb) {
		modelModel.update({ _id: id }, {name: name, file: file, creator: creator,  creationDate: creationDate,  thumbnail: thumbnail,  tags: tags}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
			if (err) { logger.error(err); return cb(err, raw); }
			else { return cb(err, 'ok'); }
		});	
	}
	/**
	 * REST Service - UpdateModel
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- name (string)		Modelname
	 *		- password -  	Password 	- required
	 *		- email -  		Email 		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateModel(req, resp) {
		logger.info("<Service> UpdateModel.");
		var objectsData = parseRequest(req, ['id', 'name', 'file', 'creator', 'creationDate', 'thumbnail', 'tags']);
		
		writeHeaders(resp);
		updateModel(objectsData.id, objectsData.name, objectsData.file, objectsData.creator, objectsData.creationDate, objectsData.thumbnail, objectsData.tags, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
	
	/**
	 * updateModelName
	 * Update the name of the Model corresponding to the given ID
	 * @param {string} id -  			ID
	 * @param {string} name -  		Name to change
	 * @param {string} cb (Function(err, User[])):	Callback(error, User[])
	 */ 
	function updateModelName(id, name, cb) {
			modelModel.update({ _id: id }, {name: name}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * REST Service - UpdateModelName
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		Username
	 *		- name -  	Name 		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateModelName(req, resp) {
		logger.info("<Service> UpdateModelName.");
		var objData = parseRequest(req, ['id', 'name']);
		
		writeHeaders(resp);
		updateModelName(objData.id, objData.name, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
		
	/**
	 * updateModelFile
	 * Update the file of the Model corresponding to the given ID
	 * @param {string} id -  			ID
	 * @param {string} name -  		File to change
	 * @param {string} cb (Function(err, User[])):	Callback(error, User[])
	 */ 
	function updateModelFile(id, name, cb) {
			modelModel.update({ _id: id }, {file: file}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * REST Service - UpdateModelFile
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		Username
	 *		- name -  	File 		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateModelFile(req, resp) {
		logger.info("<Service> UpdateModelFile.");
		var objData = parseRequest(req, ['id', 'file']);
		
		writeHeaders(resp);
		updateModelFile(objData.id, objData.file, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
		
	/**
	 * updateModelCreator
	 * Update the creator of the Model corresponding to the given ID
	 * @param {string} id -  			ID
	 * @param {string} name -  		Creator to change
	 * @param {string} cb (Function(err, User[])):	Callback(error, User[])
	 */ 
	function updateModelCreator(id, name, cb) {
			modelModel.update({ _id: id }, {creator: creator}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * REST Service - UpdateModelCreator
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		Username
	 *		- name -  	Creator 		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateModelCreator(req, resp) {
		logger.info("<Service> UpdateModelCreator.");
		var objData = parseRequest(req, ['id', 'creator']);
		
		writeHeaders(resp);
		updateModelCreator(objData.id, objData.creator, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
	
	/**
	 * updateModelCreationDate
	 * Update the creation date of the Model corresponding to the given ID
	 * @param {string} id -  			ID
	 * @param {string} name -  		CreationDate to change
	 * @param {string} cb (Function(err, User[])):	Callback(error, User[])
	 */ 
	function updateModelCreationDate(id, name, cb) {
			modelModel.update({ _id: id }, {creationDate: creationDate}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * REST Service - UpdateModelCreationDate
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		Username
	 *		- name -  	CreationDate 		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateModelCreationDate(req, resp) {
		logger.info("<Service> UpdateModelCreationDate.");
		var objData = parseRequest(req, ['id', 'creationDate']);
		
		writeHeaders(resp);
		updateModelCreationDate(objData.id, objData.creationDate, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
	
	/**
	 * updateModelThumbnail
	 * Update the thumbnail of the Model corresponding to the given ID
	 * @param {string} id -  			ID
	 * @param {string} name -  		Thumbnail to change
	 * @param {string} cb (Function(err, User[])):	Callback(error, User[])
	 */ 
	function updateModelThumbnail(id, name, cb) {
			modelModel.update({ _id: id }, {thumbnail: thumbnail}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * REST Service - UpdateModelThumbnail
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		Username
	 *		- name -  	Thumbnail 		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateModelThumbnail(req, resp) {
		logger.info("<Service> UpdateModelThumbnail.");
		var objData = parseRequest(req, ['id', 'thumbnail']);
		
		writeHeaders(resp);
		updateModelThumbnail(objData.id, objData.thumbnail, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}	
	
	/**
	 * updateModelTags
	 * Update the tags of the Model corresponding to the given ID
	 * @param {string} id -  			ID
	 * @param {string} name -  		Tags to change
	 * @param {string} cb (Function(err, User[])):	Callback(error, User[])
	 */ 
	function updateModelTags(id, name, cb) {
			modelModel.update({ _id: id }, {tags: tags}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * REST Service - UpdateModelTags
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		Username
	 *		- name -  	Tags 		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateModelTags(req, resp) {
		logger.info("<Service> UpdateModelTags.");
		var objData = parseRequest(req, ['id', 'tags']);
		
		writeHeaders(resp);
		updateModelTags(objData.id, objData.tags, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}


	/*
	 * ------------------------------------------
	 * USER + MODEL Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getUserModels
	 * Returns the models created by an User
	 * @param {string} username -  				Username
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function getUserModels(username, cb) {
		modelModel.find({creator: username}, {__v:0}).lean().exec(cb);
	}
	/**
	 * REST Service - GetUserModels
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- name (string)		name
	 */
	function serviceGetUserModels(req, resp) {
		logger.info("<Service> GetUserModels.");
		var getData = parseRequest(req, ['username']);
		
		writeHeaders(resp);
		getUserModels(getData.username, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({models: objects})); 
		});
	}


	/*
	 * ------------------------------------------
	 * RIGHTS Services
	 * ------------------------------------------
	 */
	 
	/**
	 * addRight
	 * Add a Right
	 * @param {string} modelId -  		ID of the model
	 * @param {string} username -  			ID of the user
	 * @param {string} rightToWrite (bool): 		Flag: false = Read only, true = Read+Write	
	 * @param {string} cb (Function(bool)):		Callback(error, User[])
	 */
	function addRight(modelId, username, rightToWrite, cb) {
		getUserId(username, function(err, id){
			if (err) { return cb(err, null); }
			if (!id) { return cb(null, 'User doesn\'t exist'); }
			id = id._id;
			if (rightToWrite) {
				modelUser.findByIdAndUpdate(
					id,
					{$addToSet: { writeModels : modelId, readModels : modelId }},
					{ upsert: false, multi: false },
					function (err, numberAffected, raw) {
						if (err) { logger.error(err); return cb(err, raw); }
						modelModel.findByIdAndUpdate(
							modelId,
							{$addToSet: { writers : id, readers : id }},
							{ upsert: false, multi: false },
							function (err, numberAffected, raw) {
								if (err) { logger.error(err); return cb(err, raw); }
								else { return cb(err, 'ok'); }
							});
					});	
			} else {
				modelUser.findByIdAndUpdate(
					id,
					{$addToSet: { readModels : modelId }},
					{ upsert: false, multi: false },
					function (err, numberAffected, raw) {
						if (err) { logger.error(err); return cb(err, raw); }
						modelModel.findByIdAndUpdate(
							modelId,
							{$addToSet: { readers : id }},
							{ upsert: false, multi: false },
							function (err, numberAffected, raw) {
								if (err) { logger.error(err); return cb(err, raw); }
								else { return cb(err, 'ok'); }
							});	
					});	
				
			}
		});
	}
	/**
	 * REST Service - AddRight
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *	- modelId -  		ID of the model				- required
	 *	- username -  			ID of the user				- required
	 *	- rightToWrite (bool): 		Flag for the right to write	- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceAddRight(req, resp) {
		logger.info("<Service> AddRight.");
		var objectsData = parseRequest(req, ['modelId', 'username', 'rightToWrite']);
		
		writeHeaders(resp);
		addRight(objectsData.modelId, objectsData.username, objectsData.rightToWrite, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}

	/**
	 * addCompleteRight
	 * Add a Right to Write & Read
	 * @param {string} modelId -  		ID of the model
	 * @param {string} username -  			ID of the user
	 * @param {string} cb (Function(bool)):		Callback(error, User[])
	 */
	function addCompleteRight(modelId, username, cb) {
		getUserId(username, function(err, id){
			if (err) { return cb(err, null); }
			if (!id) { return cb(null, 'User doesn\'t exist'); }
			id = id._id;
			modelUser.findByIdAndUpdate(
				id,
				{$addToSet: { writeModels : modelId, readModels : modelId }},
				{ upsert: false, multi: false },
				function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					modelModel.findByIdAndUpdate(
						modelId,
						{$addToSet: { writers : id, readers : id }},
						{ upsert: false, multi: false },
						function (err, numberAffected, raw) {
							if (err) { logger.error(err); return cb(err, raw); }
							else { return cb(err, 'ok'); }
						});
				});	
		});
	}
	/**
	 * REST Service - AddCompleteRight
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *	- modelId -  		ID of the model				- required
	 *	- username -  			ID of the user				- required
	 *	- rightToWrite (bool): 		Flag for the right to write	- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceAddCompleteRight(req, resp) {
		logger.info("<Service> AddCompleteRight.");
		var objectsData = parseRequest(req, ['modelId', 'username']);
		
		writeHeaders(resp);
		addCompleteRight(objectsData.modelId, objectsData.username, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}

	/**
	 * addReadRight
	 * Add a Right to Read
	 * @param {string} modelId -  		ID of the model
	 * @param {string} username -  			ID of the user
	 * @param {string} cb (Function(bool)):		Callback(error, User[])
	 */
	function addReadRight(modelId, username, cb) {
		getUserId(username, function(err, id){
			if (err) { return cb(err, null); }
			if (!id) { return cb(null, 'User doesn\'t exist'); }
			id = id._id;
			modelUser.findByIdAndUpdate(
				id,
				{$addToSet: { readModels : modelId }},
				{ upsert: false, multi: false },
				function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					modelModel.findByIdAndUpdate(
						modelId,
						{$addToSet: { readers : id }},
						{ upsert: false, multi: false },
						function (err, numberAffected, raw) {
							if (err) { logger.error(err); return cb(err, raw); }
							else { return cb(err, 'ok'); }
						});
				});	
		});
	}
	/**
	 * REST Service - AddReadRight
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *	- modelId -  		ID of the model				- required
	 *	- username -  			ID of the user				- required
	 *	- rightToWrite (bool): 		Flag for the right to write	- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceAddReadRight(req, resp) {
		logger.info("<Service> AddReadRight.");
		var objectsData = parseRequest(req, ['modelId', 'username']);
		
		writeHeaders(resp);
		addReadRight(objectsData.modelId, objectsData.username, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}
		
	/**
	 * removeRight
	 * Remove a Right
	 * @param {string} modelId -  		ID of the model
	 * @param {string} username -  			ID of the user
	 * @param {string} rightToWrite (bool): 		Flag: true = remove Write only, false = remove Write+Read
	 * @param {string} cb (Function(bool)):		Callback(error, User[])
	 */
	function removeRight(modelId, username, rightToWrite, cb) {
		getUserId(username, function(err, id){
			if (err) { return cb(err, null); }
			if (!id) { return cb(null, 'User doesn\'t exist'); }
			id = id._id;
			if (rightToWrite) {
				modelUser.findByIdAndUpdate(
					id,
					{$pull: { writeModels : modelId, readModels : modelId }},
					{ upsert: false, multi: false },
					function (err, numberAffected, raw) {
						if (err) { logger.error(err); return cb(err, raw); }
						modelModel.findByIdAndUpdate(
							modelId,
							{$pull: { writers : id, readers : id }},
							{ upsert: false, multi: false },
							function (err, numberAffected, raw) {
								if (err) { logger.error(err); return cb(err, raw); }
								else { return cb(err, 'ok'); }
							});
					});	
			} else {
				modelUser.findByIdAndUpdate(
					id,
					{$pull: { writeModels : modelId }},
					{ upsert: false, multi: false },
					function (err, numberAffected, raw) {
						if (err) { logger.error(err); return cb(err, raw); }
						modelModel.findByIdAndUpdate(
							modelId,
							{$pull: { writers : id }},
							{ upsert: false, multi: false },
							function (err, numberAffected, raw) {
								if (err) { logger.error(err); return cb(err, raw); }
								else { return cb(err, 'ok'); }
							});	
					});	
				
			}
		});
	}
	/**
	 * REST Service - RemoveRight
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *	- modelId -  		ID of the model				- required
	 *	- username -  			ID of the user				- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceRemoveRight(req, resp) {
		logger.info("<Service> RemoveRight.");
		var objectsData = parseRequest(req, ['modelId', 'username', 'rightToWrite']);
		
		writeHeaders(resp);
		removeRight(objectsData.modelId, objectsData.username, objectsData.rightToWrite, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}
		
	/**
	 * removeCompleteRight
	 * Remove a Right to Write & Read
	 * @param {string} modelId -  		ID of the model
	 * @param {string} username -  			ID of the user
	 * @param {string} cb (Function(bool)):		Callback(error, User[])
	 */
	function removeCompleteRight(modelId, username, cb) {
		getUserId(username, function(err, id){
			if (err) { return cb(err, null); }
			if (!id) { return cb(null, 'User doesn\'t exist'); }
			id = id._id;
			modelUser.findByIdAndUpdate(
				id,
				{$pull: { writeModels : modelId, readModels : modelId }},
				{ upsert: false, multi: false },
				function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					modelModel.findByIdAndUpdate(
						modelId,
						{$pull: { writers : id, readers : id }},
						{ upsert: false, multi: false },
						function (err, numberAffected, raw) {
							if (err) { logger.error(err); return cb(err, raw); }
							else { return cb(err, 'ok'); }
						});
				});	
		});
	}
	/**
	 * REST Service - RemoveCompleteRight
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *	- modelId -  		ID of the model				- required
	 *	- username -  			ID of the user				- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceRemoveCompleteRight(req, resp) {
		logger.info("<Service> RemoveCompleteRight.");
		var objectsData = parseRequest(req, ['modelId', 'username']);
		
		writeHeaders(resp);
		removeCompleteRight(objectsData.modelId, objectsData.username, objectsData.rightToWrite, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}
		
	/**
	 * removeWriteRight
	 * Remove a Right to Write & Read
	 * @param {string} modelId -  		ID of the model
	 * @param {string} username -  			ID of the user
	 * @param {string} cb (Function(bool)):		Callback(error, User[])
	 */
	function removeWriteRight(modelId, username, cb) {
		getUserId(username, function(err, id){
			if (err) { return cb(err, null); }
			if (!id) { return cb(null, 'User doesn\'t exist'); }
			id = id._id;
			modelUser.findByIdAndUpdate(
				id,
				{$pull: { writeModels : modelId }},
				{ upsert: false, multi: false },
				function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					modelModel.findByIdAndUpdate(
						modelId,
						{$pull: { writers : id }},
						{ upsert: false, multi: false },
						function (err, numberAffected, raw) {
							if (err) { logger.error(err); return cb(err, raw); }
							else { return cb(err, 'ok'); }
						});
				});	
		});
	}
	/**
	 * REST Service - RemoveWriteRight
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *	- modelId -  		ID of the model				- required
	 *	- username -  			ID of the user				- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceRemoveWriteRight(req, resp) {
		logger.info("<Service> RemoveWriteRight.");
		var objectsData = parseRequest(req, ['modelId', 'username']);
		
		writeHeaders(resp);
		removeWriteRight(objectsData.modelId, objectsData.username, objectsData.rightToWrite, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}
		 	 
	/**
	 * getPersonallyReadableModels
	 * Returns a list of Model the User got the personal right to read
	 * 	- username - 				ID of the User
	 * @param {string} limit (int): 					Number max of Model to return
	 * @param {string} offset (int): 				Number of the Model to start with
	 * @param {string} cb (Function(err, Right[])):	Callback(error, User[])
	 */
	function getPersonallyReadableModels(username, limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelUser.findOne(username).populate('readModels', '-__v -writers -readers').sort({name: 1}).skip(offset).limit(limit).exec(function(err, user) {
				if (!user) { return cb(null, 'User doesn\'t exist'); }
				cb(err, user.readModels);
			});
		}
		else {
			modelUser.findOne(username).populate('readModels', '-__v -writers -readers').sort({name: 1}).skip(offset).exec(function(err, user) {
				if (!user) { return cb(null, 'User doesn\'t exist'); }
				cb(err, user.readModels);
			});
		}
	}
	/**
	 * REST Service - GetPersonallyReadableModels
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 * 		- username - 	ID of the User						- required
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetPersonallyReadableModels(req, resp) {
		logger.info("<Service> GetPersonallyReadableModels.");
		var getData = parseRequest(req, ['username', 'limit', 'offset']);
		
		writeHeaders(resp);
		getPersonallyReadableModels(getData.username, getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ readModels: objects })); 
		});
	}
  
	/**
	 * getPersonallyEditableModels
	 * Returns a list of Model the User got the personal right to edit
	 * 	- username - 				ID of the User
	 * @param {string} limit (int): 					Number max of Model to return
	 * @param {string} offset (int): 				Number of the Model to start with
	 * @param {string} cb (Function(err, Right[])):	Callback(error, User[])
	 */
	function getPersonallyEditableModels(username, limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelUser.findOne(username).populate('writeModels', '-__v -writers -readers').sort({name: 1}).skip(offset).limit(limit).lean().exec(function(err, user) {
				if (!user) { return cb(null, 'User doesn\'t exist'); }
				cb(err, user.writeModels);
			});
		}
		else {
			modelUser.findOne(username).populate('writeModels', '-__v -writers -readers').sort({name: 1}).skip(offset).lean().exec(function(err, user) {
				if (!user) { return cb(null, 'User doesn\'t exist'); }
				cb(err, user.writeModels);
			});
		}
	}
	/**
	 * REST Service - GetPersonallyEditableModels
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 * 		- username - 	ID of the User						- required
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetPersonallyEditableModels(req, resp) {
		logger.info("<Service> GetPersonallyEditableModels.");
		var getData = parseRequest(req, ['username', 'limit', 'offset']);
		
		writeHeaders(resp);
		getPersonallyEditableModels(getData.username, getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ writeModels: objects })); 
		});
	}

	/**
	 * getPubliclyReadableModels
	 * Returns a list of Model with public consultation
	 * @param {string} limit (int): 					Number max of Model to return
	 * @param {string} offset (int): 				Number of the Model to start with
	 * @param {string} cb (Function(err, Right[])):	Callback(error, User[])
	 */
	function getPubliclyReadableModels(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelModel.find({publicRead: true}, {__v: 0, writers: 0, readers: 0}).sort({name: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelModel.find({publicRead: true}, {__v: 0, writers: 0, readers: 0}).sort({name: 1}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * REST Service - GetPubliclyReadableModels
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetPubliclyReadableModels(req, resp) {
		logger.info("<Service> GetPubliclyEditableModels.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getPubliclyReadableModels(getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ models: objects })); 
		});
	}
 	   
	/**
	 * getPubliclyEditableModels
	 * Returns a list of Model with public edition
	 * @param {string} limit (int): 					Number max of Model to return
	 * @param {string} offset (int): 				Number of the Model to start with
	 * @param {string} cb (Function(err, Right[])):	Callback(error, User[])
	 */
	function getPubliclyEditableModels(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelModel.find({publicWrite: true}, {__v: 0, writers: 0, readers: 0}).sort({name: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelModel.find({publicWrite: true}, {__v: 0, writers: 0, readers: 0}).sort({name: 1}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * REST Service - GetPubliclyEditableModels
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetPubliclyEditableModels(req, resp) {
		logger.info("<Service> GetPubliclyEditableModels.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getPubliclyEditableModels(getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ models: objects })); 
		});
	}
 	 	 	 	 
	/**
	 * getWriters
	 * Returns a list of User the Model can be edited by
	 * 	- modelId - 				ID of the Model
	 * @param {string} limit (int): 					Number max of User to return
	 * @param {string} offset (int): 				Number of the User to start with
	 * @param {string} cb (Function(err, Right[])):	Callback(error, User[])
	 */
	function getWriters(modelId, limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelModel.findOne(modelId).populate('writers', '-__v -_id -readModels -writeModels').sort({name: 1}).skip(offset).limit(limit).exec(function(err, model) {
				if (!model) { return cb(null, 'Model doesn\'t exist'); }
				cb(err, model.writers);
			});
		}
		else {
			modelModel.findOne(modelId).populate('writers', '-__v -_id -readModels -writeModels').sort({name: 1}).skip(offset).lean().exec(function(err, model) {
				if (!model) { return cb(null, 'Model doesn\'t exist'); }
				cb(err, model.writers);
			});
		}
	}
	/**
	 * REST Service - GetWriters
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 * 		- modelId - 	ID of the Model						- required
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetWriters(req, resp) {
		logger.info("<Service> GetWriters.");
		var getData = parseRequest(req, ['modelId', 'limit', 'offset']);
		
		writeHeaders(resp);
		getWriters(getData.modelId, getData.limit, getData.offset, function (err, objects) {
			logger.error(err);
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ writers: objects })); 
		});
	}
 	 	 	 
	/**
	 * getReaders
	 * Returns a list of User the Model can be edited by
	 * 	- modelId - 				ID of the Model
	 * @param {string} limit (int): 					Number max of User to return
	 * @param {string} offset (int): 				Number of the User to start with
	 * @param {string} cb (Function(err, Right[])):	Callback(error, User[])
	 */
	function getReaders(modelId, limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelModel.findOne(modelId).populate('readers', '-__v -_id -readModels -writeModels').sort({name: 1}).skip(offset).limit(limit).exec(function(err, model) {
				if (!model) { return cb(null, 'Model doesn\'t exist'); }
				cb(err, model.readers);
			});
		}
		else {
			modelModel.findOne(modelId).populate('readers', '-__v -_id -readModels -writeModels').sort({name: 1}).skip(offset).exec(function(err, model) {
				if (!model) { return cb(null, 'Model doesn\'t exist'); }
				cb(err, model.readers);
			});
		}
	}
	/**
	 * REST Service - GetReaders
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 * 		- modelId - 	ID of the Model						- required
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetReaders(req, resp) {
		logger.info("<Service> GetReaders.");
		var getData = parseRequest(req, ['modelId', 'limit', 'offset']);
		
		writeHeaders(resp);
		getReaders(getData.modelId, getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ readers: objects })); 
		});
	}

	/**
	 * getModelPublicRead
	 * Returns the Model's public read flag
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function getModelPublicRead(id, cb) {
		modelModel.findById(id).select('publicRead').lean().exec(cb);
	}
	/**
	 * REST Service - GetModelPublicRead
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetModelPublicRead(req, resp) {
		logger.info("<Service> GetModelPublicRead.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelPublicRead(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({publicRead: obj.publicRead})); 
		});
	}

	/**
	 * getModelPublicWrite
	 * Returns the Model's public write flag
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function getModelPublicWrite(id, cb) {
		modelModel.findById(id).select('publicWrite').lean().exec(cb);
	}
	/**
	 * REST Service - GetModelPublicWrite
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetModelPublicWrite(req, resp) {
		logger.info("<Service> GetModelPublicWrite.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelPublicWrite(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({publicWrite: obj.publicWrite})); 
		});
	}
	 
	/**
	 * updateModelPublicRead
	 * Update the public read flag of the Model corresponding to the given ID
	 * @param {string} id -  					ID
	 * @param {string} flag (bool): 					Flag Value
	 * @param {string} cb (Function(err, User[])):	Callback(error, User[])
	 */ 
	function updateModelPublicRead(id, flag, cb) {
			modelModel.update({ _id: id }, {publicRead: flag}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * REST Service - UpdateModelPublicRead
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		Username
	 *		- flag (bool): 		Flag Value		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateModelPublicRead(req, resp) {
		logger.info("<Service> UpdateModelPublicRead.");
		var objData = parseRequest(req, ['id', 'publicRead']);
		
		writeHeaders(resp);
		updateModelPublicRead(objData.id, objData.tags, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
	 
	/**
	 * updateModelPublicWrite
	 * Update the public write flag of the Model corresponding to the given ID
	 * @param {string} id -  					ID
	 * @param {string} flag (bool): 					Flag Value
	 * @param {string} cb (Function(err, User[])):	Callback(error, User[])
	 */ 
	function updateModelPublicWrite(id, flag, cb) {
			modelModel.update({ _id: id }, {publicWrite: flag}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * REST Service - UpdateModelPublicWrite
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		Username
	 *		- flag (bool): 		Flag Value		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateModelPublicWrite(req, resp) {
		logger.info("<Service> UpdateModelPublicWrite.");
		var objData = parseRequest(req, ['id', 'publicWrite']);
		
		writeHeaders(resp);
		updateModelPublicWrite(objData.id, objData.tags, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
	 	
	
	/*
	 * ------------------------------------------
	 * COMMENTS Services
	 * ------------------------------------------
	 */

	/**
	 * createComment
	 * Create a Comment.
	 * @param {string} modelId -  		Model the comment is associated with
	 * @param {string} author -  			User ID of the author
	 * @param {string} text -  			Content
	 * @param {string} postedDate (Date): 		Date of creation
	 * 	- parentId (String)			ID of the parent comment (optional)
	 * @param {string} cb (Function(bool)):		Callback(error, User[])
	 */
	function createComment(modelId, author, text, postedDate, parentId, cb) {
		var slug = author+postedDate.toISOString();
		if (parentId) {
			modelComment.findById(parentId).exec(function(err, parentCom) {
				if (err) { error(2, resp); return; }
				if (!parentCom) { cb(null, 'Parent doesn\'t exist'); return; }
				slug = parentCom.slug + '/' + slug;
				var comment = new modelComment({modelId: modelId, author: author, text: text, postedDate: postedDate, parentId: parentId, slug: slug});
				comment.save(function(err) {
					cb (err, 'ok');
				});
			});
		} else {
			var comment = new modelComment({modelId: modelId, author: author, text: text, postedDate: postedDate, parentId: parentId, slug: slug});
			comment.save(function(err) {
				cb (err, 'ok');
			});
		}
	}
	/**
	 * REST Service - CreateComment
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *	- modelId -  		Model the comment is associated with	- required
	 *	- author -  			User ID of the author					- required
	 *	- text -  			Content									- required
	 *	- postedDate (Date): 		Date of creation						- required
	 * 	- parentId (String)			ID of the parent comment (optional)		- o
	 *	- cb (Function(bool)):		Callback(error, User[])								- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceCreateComment(req, resp) {
		logger.info("<Service> CreateComment.");
		var userData = parseRequest(req, ['modelId', 'author', 'text', 'postedDate', 'parentId']);
		
		writeHeaders(resp);
		createComment(userData.username, userData.password, userData.email, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}
	 
	/**
	 * getComments
	 * Returns a list of comments, ordered by date.
	 * @param {string} limit (int): 					Number max of users to return
	 * @param {string} offset (int): 				Number of the comment to start with
	 * @param {string} cb (Function(err, Comment[])):	Callback(error, User[])
	 */
	function getComments(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelComment.find({}, {__v:0}).sort({postedDate: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelComment.find({}, {__v:0}).sort({postedDate: 1}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * REST Service - GetComments
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the comment to start with	- optional
	 */
	function serviceGetComments(req, resp) {
		logger.info("<Service> GetComments.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getComments(getData.limit, getData.offset, function (err, users) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ users: users })); 
		});
	}

	/*
	 * ------------------------------------------
	 * COMMENT Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getComment
	 * Returns the Comment corresponding to the given id
	 * @param {string} id -  						ID
	 * @param {string} cb (Function(err, Comment[])):	Callback(error, User[])
	 */
	function getComment(id, cb) {
		modelComment.findById(id, {__v:0}).lean().exec(cb);
	}
	/**
	 * REST Service - GetComment
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		id
	 */
	function serviceGetComment(req, resp) {
		logger.info("<Service> GetComment.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getComment(getData.id, function (err, comment) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify(comment)); 
		});
	}

	/**
	 * getCommentModelId
	 * Returns the Comment's modelId
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Comment[])):	Callback(error, User[])
	 */
	function getCommentModelId(id, cb) {
		modelComment.findById(id).select('modelId').lean().exec(cb);
	}
	/**
	 * REST Service - GetCommentModelId
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetCommentModelId(req, resp) {
		logger.info("<Service> GetCommentModelId.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getCommentModelId(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ modelId: obj.modelId })); 
		});
	}

	/**
	 * getCommentAuthor
	 * Returns the Comment's author
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Comment[])):	Callback(error, User[])
	 */
	function getCommentAuthor(id, cb) {
		modelComment.findById(id).select('author').lean().exec(cb);
	}
	/**
	 * REST Service - GetCommentAuthor
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetCommentAuthor(req, resp) {
		logger.info("<Service> GetCommentAuthor.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getCommentAuthor(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ author: obj.author })); 
		});
	}

	/**
	 * getCommentParentId
	 * Returns the Comment's parentId
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Comment[])):	Callback(error, User[])
	 */
	function getCommentParentId(id, cb) {
		modelComment.findById(id).select('parentId').lean().exec(cb);
	}
	/**
	 * REST Service - GetCommentParentId
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetCommentParentId(req, resp) {
		logger.info("<Service> GetCommentParentId.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getCommentParentId(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ parentId: obj.parentId })); 
		});
	}

	/**
	 * getCommentSlug
	 * Returns the Comment's slug
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Comment[])):	Callback(error, User[])
	 */
	function getCommentSlug(id, cb) {
		modelComment.findById(id).select('slug').lean().exec(cb);
	}
	/**
	 * REST Service - GetCommentSlug
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetCommentSlug(req, resp) {
		logger.info("<Service> GetCommentSlug.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getCommentSlug(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ slug: obj.slug })); 
		});
	}

	/**
	 * getCommentPostedDate
	 * Returns the Comment's postedDate
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Comment[])):	Callback(error, User[])
	 */
	function getCommentPostedDate(id, cb) {
		modelComment.findById(id).select('postedDate').lean().exec(cb);
	}
	/**
	 * REST Service - GetCommentPostedDate
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetCommentPostedDate(req, resp) {
		logger.info("<Service> GetCommentPostedDate.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getCommentPostedDate(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ postedDate: obj.postedDate })); 
		});
	}

	/**
	 * getCommentText
	 * Returns the Comment's text
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, Comment[])):	Callback(error, User[])
	 */
	function getCommentText(id, cb) {
		modelComment.findById(id).select('text').lean().exec(cb);
	}
	/**
	 * REST Service - GetCommentText
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetCommentText(req, resp) {
		logger.info("<Service> GetCommentText.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getCommentText(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ text: obj.text })); 
		});
	}
		
	/**
	 * updateCommentText
	 * Update the text of the Comment corresponding to the given ID
	 * @param {string} id -  			ID
	 * @param {string} name -  		Text to change
	 * @param {string} cb (Function(err, User[])):	Callback(error, User[])
	 */ 
	function updateCommentText(id, name, cb) {
			modelComment.update({ _id: id }, {text: text}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * REST Service - UpdateCommentText
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		Username
	 *		- name -  	Text 		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateCommentText(req, resp) {
		logger.info("<Service> UpdateCommentText.");
		var objData = parseRequest(req, ['id', 'text']);
		
		writeHeaders(resp);
		updateCommentText(objData.id, objData.text, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
	 
	/**
	 * deleteComment
	 * Delete the Comment corresponding to the given ID
	 * @param {string} id -  						ID
	 * @param {string} cb (Function(err, Comment[])):	Callback(error, User[])
	 */
	function deleteComment(id, cb) {
		modelComment.findById(id).exec(function (err, item) {
			if (err){
				cb(err, null);
			}
              else {
					modelComment.remove(item, function (err, result) {
						cb(err, result);
					});
              }
       });
	}
	/**
	 * REST Service - DeleteComment
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceDeleteComment(req, resp) {
		logger.info("<Service> DeleteComment.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		deleteComment(getData.id, function (err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}


	/*
	 * ------------------------------------------
	 * USER + COMMENT Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getUserComments
	 * Returns the Comments created by an User
	 * @param {string} username -  				Username
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function getUserComments(username, cb) {
		modelComment.find({author: username}, {__v:0}).lean().exec(cb);
	}
	/**
	 * REST Service - GetUserComments
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- name (string)		name
	 */
	function serviceGetUserComments(req, resp) {
		logger.info("<Service> GetUserComments.");
		var getData = parseRequest(req, ['username']);
		
		writeHeaders(resp);
		getUserComments(getData.username, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({models: objects})); 
		});
	}


	/*
	 * ------------------------------------------
	 * MODEL + COMMENT Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getModelComments
	 * Returns the Comments created for an Model
	 * @param {string} modelId -  			Model's ID
	 * @param {string} cb (Function(err, Model[])):	Callback(error, User[])
	 */
	function getModelComments(modelId, cb) {
		modelComment.find({modelId: modelId}, {__v:0}).lean().exec(cb);
	}
	/**
	 * REST Service - GetModelComments
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- modelId (string)		modelId
	 */
	function serviceGetModelComments(req, resp) {
		logger.info("<Service> GetModelComments.");
		var getData = parseRequest(req, ['modelId']);
		
		writeHeaders(resp);
		getModelComments(getData.modelId, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({models: objects})); 
		});
	}
		
	
	/*
	 * ------------------------------------------
	 * FILES Services
	 * ------------------------------------------
	 */

	/**
	 * createFile
	 * Create a File.
	 * @param {string} content -  		Content of the File
	 * @param {string} cb (Function(bool)):		Callback(error, User[])
	 */
	function createFile(content, cb) {
		var comment = new modelFile({content: content});
		comment.save(function(err) {
			cb (err, 'ok');
		});
	}
	/**
	 * REST Service - CreateFile
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *	- content -  		Content	- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceCreateFile(req, resp) {
		logger.info("<Service> CreateFile.");
		var userData = parseRequest(req, ['content']);
		
		writeHeaders(resp);
		createFile(userData.content, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}
	 
	/**
	 * getFiles
	 * Returns a list of Files.
	 * @param {string} limit (int): 					Number max of files to return
	 * @param {string} offset (int): 				Number of the file to start with
	 * @param {string} cb (Function(err, File[])):	Callback(error, User[])
	 */
	function getFiles(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelFile.find({}, {__v:0}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelFile.find({}, {__v:0}).skip(offset).lean().exec(cb);
		}
	}
	
	/**
	 * REST Service - GetFiles
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the comment to start with	- optional
	 */
	function serviceGetFiles(req, resp) {
		logger.info("<Service> GetFiles.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getFiles(getData.limit, getData.offset, function (err, users) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ users: users })); 
		});
	}
 	
 	
 	/*
	 * ------------------------------------------
	 * FILE Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getFile
	 * Returns the File corresponding to the given id
	 * @param {string} id -  						ID
	 * @param {string} cb (Function(err, File[])):	Callback(error, User[])
	 */
	function getFile(id, cb) {
		modelFile.findById(id, {__v:0}).lean().exec(cb);
	}
	/**
	 * REST Service - GetFile
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		id
	 */
	function serviceGetFile(req, resp) {
		logger.info("<Service> GetFile.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getFile(getData.id, function (err, comment) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify(comment)); 
		});
	}

	/**
	 * getFileContent
	 * Returns the File's content
	 * @param {string} id -  					ID
	 * @param {string} cb (Function(err, File[])):	Callback(error, User[])
	 */
	function getFileContent(id, cb) {
		modelFile.findById(id).select('content').lean().exec(cb);
	}
	/**
	 * REST Service - GetFileContent
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceGetFileContent(req, resp) {
		logger.info("<Service> GetFileContent.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getFileContent(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ content: obj.content })); 
		});
	}
			
	/**
	 * updateFileContent
	 * Update the content of the File corresponding to the given ID
	 * @param {string} id -  			ID
	 * @param {string} name -  		Content to change
	 * @param {string} cb (Function(err, User[])):	Callback(error, User[])
	 */ 
	function updateFileContent(id, name, cb) {
			modelFile.update({ _id: id }, {content: content}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * REST Service - UpdateFileContent
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		Username
	 *		- name -  	Content 		- required
	 * @param {ExpressResponse} resp- Response Object.
	 */
	function serviceUpdateFileContent(req, resp) {
		logger.info("<Service> UpdateFileContent.");
		var objData = parseRequest(req, ['id', 'content']);
		
		writeHeaders(resp);
		updateFileContent(objData.id, objData.content, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}
	 
	/**
	 * deleteFile
	 * Delete the File corresponding to the given ID
	 * @param {string} id -  						ID
	 * @param {string} cb (Function(err, File[])):	Callback(error, User[])
	 */
	function deleteFile(id, cb) {
		modelFile.findById(id).exec(function (err, item) {
			if (err){
				cb(err, null);
			}
              else {
					modelFile.remove(item, function (err, result) {
						cb(err, result);
					});
              }
       });
	}
	/**
	 * REST Service - DeleteFile
	 * @param {ExpressRequest} req - Request Object. Should contain the following parameters: 
	 * 		- id (string)		ID
	 */
	function serviceDeleteFile(req, resp) {
		logger.info("<Service> DeleteFile.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		deleteFile(getData.id, function (err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status })); 
		});
	}

	
	/*
	 * ------------------------------------------
	 * ROUTING
	 * ------------------------------------------
	 */
	 
	this.rest = {};
	this.rest['users'] = {
		'POST'	: serviceCreateUser,
		'GET'	: serviceGetUsers
	};
	this.rest['user/:username'] = {
		'GET'	: serviceGetUser,
		'DELETE': serviceDeleteUser,
		'PUT'	: serviceUpdateUser
	};
	this.rest['user/:username/id'] = {
		'GET'	: serviceGetUserId
	};
	this.rest['user/:username/email'] = {
		'GET'	: serviceGetUserEmail,
		'PUT'	: serviceUpdateUserEmail
	};
	this.rest['user/:username/password'] = {
		'PUT'	: serviceUpdateUserPassword
	};
	
	
	this.rest['models'] = {
		'POST'	: serviceCreateModel,
		'GET'	: serviceGetModels
	};
	this.rest['model/:id'] = {
		'GET'	: serviceGetModel,
		'DELETE': serviceDeleteModel,
		'PUT'	: serviceUpdateModel
	};
	this.rest['model/:id/name'] = {
		'GET'	: serviceGetModelName,
		'PUT'	: serviceUpdateModelName
	};
	this.rest['model/:id/file'] = {
		'GET'	: serviceGetModelFile,
		'PUT'	: serviceUpdateModelFile
	};
	this.rest['model/:id/creator'] = {
		'GET'	: serviceGetModelCreator,
		'PUT'	: serviceUpdateModelCreator
	};
	this.rest['model/:id/creationdate'] = {
		'GET'	: serviceGetModelCreationDate,
		'PUT'	: serviceUpdateModelCreationDate
	};
	this.rest['model/:id/thumbnail'] = {
		'GET'	: serviceGetModelThumbnail,
		'PUT'	: serviceUpdateModelThumbnail
	};
	this.rest['model/:id/tags'] = {
		'GET'	: serviceGetModelTags,
		'PUT'	: serviceUpdateModelTags
	};

	this.rest['model/:id/publicRead'] = {
		'GET'	: serviceGetModelPublicRead,
		'PUT'	: serviceUpdateModelPublicRead
	};
	this.rest['model/:id/publicWrite'] = {
		'GET'	: serviceGetModelPublicWrite,
		'PUT'	: serviceUpdateModelPublicWrite
	};

	this.rest['models/publicRead'] = {
		'GET'	: serviceGetPubliclyReadableModels
	};
	this.rest['models/publicWrite'] = {
		'GET'	: serviceGetPubliclyEditableModels
	};
		
	this.rest['model/:modelId/writers'] = {
		'GET'	: serviceGetWriters,
		'POST'	: serviceAddCompleteRight
	};
	this.rest['model/:modelId/readers'] = {
		'GET'	: serviceGetReaders,
		'POST'	: serviceAddReadRight
	};
	this.rest['user/:username/writeModels'] = {
		'GET'	: serviceGetPersonallyEditableModels,
		'POST'	: serviceAddCompleteRight
	};
	this.rest['user/:username/readModels'] = {
		'GET'	: serviceGetPersonallyReadableModels,
		'POST'	: serviceAddReadRight
	};

	this.rest['user/:username/writeModel/:modelId'] = {
		'DELETE': serviceRemoveWriteRight
	};
	this.rest['user/:username/readModel/:modelId'] = {
		'DELETE': serviceRemoveCompleteRight
	};
	this.rest['model/:modelId/writer/:username'] = {
		'DELETE': serviceRemoveWriteRight
	};
	this.rest['model/:modelId/reader/:username'] = {
		'DELETE': serviceRemoveCompleteRight
	};

	this.rest['user/:username/models'] = {
		'GET'	: serviceGetUserModels
	};
	
	this.rest['comments'] = {
		'POST'	: serviceCreateComment,
		'GET'	: serviceGetComments
	};
	this.rest['comment/:id'] = {
		'GET'	: serviceGetComment,
		'DELETE': serviceDeleteComment,
	};
	this.rest['comment/:id/modelId'] = {
		'GET'	: serviceGetCommentModelId
	};
	this.rest['comment/:id/author'] = {
		'GET'	: serviceGetCommentAuthor
	};
	this.rest['comment/:id/text'] = {
		'GET'	: serviceGetCommentText,
		'PUT'	: serviceUpdateCommentText
	};
	this.rest['comment/:id/slug'] = {
		'GET'	: serviceGetCommentSlug
	};
	this.rest['comment/:id/postedDate'] = {
		'GET'	: serviceGetCommentPostedDate
	};
	this.rest['comment/:id/parentId'] = {
		'GET'	: serviceGetCommentParentId
	};

	this.rest['user/:username/comments'] = {
		'GET'	: serviceGetUserComments
	};
	this.rest['model/:modelId/comments'] = {
		'GET'	: serviceGetModelComments
	};
	
	this.rest['files'] = {
		'POST'	: serviceCreateFile,
		'GET'	: serviceGetFile
	};
	this.rest['file/:id'] = {
		'GET'	: serviceGetFile,
		'DELETE': serviceDeleteFile,
	};
	this.rest['file/:id/content'] = {
		'GET'	: serviceGetFileContent,
		'PUT'	: serviceUpdateFileContent
	};

	/*
	 * ------------------------------------------
	 * LOCAL MODULE METHODS
	 * ------------------------------------------
	 */
	 
	/*this.local = {};
	this.local.createUser = createUser;
	this.local.getUsers = getUsers;
	this.local.getUser = getUser;
	*/
	
	return this;
};
