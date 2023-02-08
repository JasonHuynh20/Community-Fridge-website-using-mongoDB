// This module is cached as it has already been loaded
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
let router = express.Router();

let Fridge = require("./models/fridgeModel");
let Item = require("./models/itemModel");

app.use(express.json()); // body-parser middleware

//----------------------------------------------------------------------1------------------------------------------------------
router.get("/", function(req, res, next){
  if (req.accepts('json')) {
    Fridge.find({}, function (err, docs) {
      if(err) throw err;
      res.send(docs);
    });
  }
});

//----------------------------------------------------------------------2------------------------------------------------------
router.get("/:fridgeID", function(req, res, next){
		let fridgeId = req.params.fridgeID;

    Fridge.find({id: fridgeId}, function (err, docs) {
      if(err) throw err;
      if(docs.length > 0){
        res.send(docs);
      }else{
        res.status(400).send();
      }
    });
});

//----------------------------------------------------------------------3------------------------------------------------------
router.post("/", express.json(), function(req,res,next){
	// console.log("Inside the /catalog POST request...");
	let fridgeData = req.body; 	// access the body of the POST

  ////HOW TO CHECK IF THE DATA MEETS THE REQUIREMENTS
	if(fridgeData === undefined){
		res.status(400).send("The Post body is poorly formatted.");
	}

  let id = fridgeData.id;
  let name = fridgeData.name;
  let numItemsAccepted = fridgeData.numItemsAccepted;
  let canAcceptItems = fridgeData.canAcceptItems;
  let contactInfo = fridgeData.contactInfo;
  let address = fridgeData.address;
  let acceptedTypes = fridgeData.acceptedTypes;
  let items = fridgeData.items;

  if(id === undefined || name === undefined || numItemsAccepted === undefined || canAcceptItems === undefined || contactInfo === undefined || address === undefined || acceptedTypes === undefined || items === undefined){
    res.status(400).send("The Post body is poorly formatted.");
  }

	else {

    let newFridge = new Fridge({
      id: id,
      name: name,
      numItemsAccepted: numItemsAccepted,
      canAcceptItems: canAcceptItems,
      contactInfo: contactInfo,
      address: address,
      acceptedTypes: acceptedTypes,
      items: items
    });

    newFridge.save(function(err){
  		if(err) throw err;
  		res.status(200);
      res.send(newFridge);
  	});

	}
});

//----------------------------------------------------------------------4------------------------------------------------------
router.put("/:fridgeID", express.json(), function(req,res,next){

	let fridgeData = req.body;
	let fridgeId = req.params.fridgeID;

	if(fridgeData === undefined){
		res.status(400).send("Something is poorly formatted.");
	}

  // let doc = Fridge.findOne({id: fridgeId});
  //
  // doc.updateOne(fridgeData);

  Fridge.findOneAndUpdate({ id: fridgeId }, { "$set": fridgeData}).exec(function(err, book){
     if(err) {
         console.log(err);
         res.status(400).send(err);
     } else {
        res.status(200).send();
     }
  });
});

//----------------------------------------------------------------------5------------------------------------------------------
router.post("/:fridgeID/items", express.json(), function(req,res,next){
	let itemData = req.body;
  let fridgeId = req.params.fridgeID;

  ////HOW TO CHECK IF THE DATA MEETS THE REQUIREMENTS
	if(itemData === undefined){
		res.status(400).send("The Post body is poorly formatted.");
	}
  console.log("this is here");

  Fridge.findOne({id: fridgeId, "items.id": itemData.id}).exec(function(err, result){
    console.log("result: " + result);
    if(result){
      res.status(409).send("There is a duplicate.");
    }else{
      Fridge.findOneAndUpdate({id: fridgeId}, {$push: {items: itemData}}).exec(function(err, results){
        if(err) throw err;
        res.status(200);
        res.send();
      });

    }
  });
  // console.log(exists);

});

//----------------------------------------------------------------------6------------------------------------------------------
router.delete("/:fridgeID/items/:itemID", express.json(), function(req,res,next){
	// let itemData = req.body;
  let fridgeId = req.params.fridgeID;
  let itemId = req.params.itemID;

  ////HOW TO CHECK IF THE DATA MEETS THE REQUIREMENTS
	// if(itemData === undefined){
	// 	res.status(400).send("The Post body is poorly formatted.");
	// }

  Fridge.findOne({id: fridgeId}).exec(function(err,result){
    if(err) throw err;
    Fridge.findOne({"items.id": itemId}).exec(function(errs, results){
      if(errs) throw errs;
      console.log("result: " + result + " results: " + results);
      if(result && results){
        Fridge.findOneAndUpdate({id: fridgeId}, {$pull: {items: {id: itemId}}}).exec(function(errss, resultss){
          if(errss) throw errss;
          res.status(200);
          res.send();
        });
      }else {
        res.status(404).send("Not found");
      }
    });
  });
});


//----------------------------------------------------------------------7------------------------------------------------------
router.delete("/:fridgeID/items", express.json(), async function(req,res,next){
  let fridgeId = req.params.fridgeID;
  let itemIds = req.query.item;
  // console.log(itemIds);


  //if fridge doesnt exist
  Fridge.findOne({id: fridgeId}).exec(async function(err, result){
    if(err) throw err;
    if(!result){
      res.status(404).send("Not found");
      return;
    }

    //if the query is empty
    if(itemIds.length == 0){
      Fridge.findOneAndUpdate({id: fridgeId}, {$set: {items: []}}).exec(function(err, results){
        if(err) throw err;
        res.status(200);
        res.send();
        return;
      });
    }

    //if item doesnt exist
    for(let i = 0; i < itemIds.length; i++){
      let results = await Fridge.findOne({id: fridgeId, "items.id": itemIds[i]}).exec();
      if(!results){
        console.log("serach item");
        res.status(404).send("Not found");
      }
    }

      //delete the list
    for(let i = 0; i < itemIds.length; i++){
      let resultz = await Fridge.findOneAndUpdate({id: fridgeId}, {$pull: {items: {id: itemIds[i]}}}).exec();
      if(resultz){
        res.status(200);
        res.send();
      }
    }

  });





//http://localhost:8000/fridges/fg-3/items?item=1&item=2&item=3
});

//----------------------------------------------------------------------1------------------------------------------------------
router.put("/:fridgeID/items/:itemID", express.json(), function(req,res,next){
	// let itemData = req.body;
  let fridgeId = req.params.fridgeID;
  let itemId = req.params.itemID;
  let itemData = req.body;
  let found = false;


	if(itemData.quantity === undefined){
		res.status(400).send("The Post body is poorly formatted.");
	}


  Fridge.findOne({id: fridgeId}).exec(function(err,result){
    if(err) console.log(err);//console log the error

    if(!result){
      res.status(404);
      res.send(" fridge not found");
      return;
    }

    for(let i = 0; i < result.items.length; i++){
      if(result.items[i].id == itemId){
        result.items[i].quantity = itemData.quantity;
        found = true;
      }
    }

    if(!found){
      res.status(404);
      res.send(" item not found");
      return;
    }


    result.save(function(errs){
      if(errs) throw errs;
      res.status(200);
      res.send(itemData);
    });
  });
});




//----------------------------------------------------------------------2------------------------------------------------------
router.post("/items", express.json(), function(req,res,next){
	let itemData = req.body;

  if(itemData.id === undefined || itemData.name === undefined || itemData.type === undefined || itemData.img === undefined){
    res.status(400);
    res.send("body poorly formatted");
    return;
  }

  Item.findOne({name: itemData.name}).exec(function(err,result){
    if(err) throw err;
    if(!result){

      // let newItem = itemData;
      let newItem = new Item({
        id: itemData.id,
        name: itemData.name,
        type: itemData.type,
        img: itemData.img
      });

      newItem.save(function(errs){
        if(errs) throw errs;
        res.status(200);
        res.send(newItem);
      });

    }else{
      res.status(409);
      res.send("There is a duplicate");
    }
  });
});


//----------------------------------------------------------------------3------------------------------------------------------3
router.get("/search/items", function(req, res, next){
    let type = req.query.type;
    let name = req.query.name;

    if(type === undefined || name === undefined){
      res.status(400);
      res.send("improper query");
    }

    const searchQuery = {};

    if(name !== undefined){
      searchQuery['name'] = {$regex: new RegExp(name, "i")};
    }
    if(type !== undefined){
      searchQuery['type'] = type;
    }

    Item.find(searchQuery, function (err, docs) {
      if(err) throw err;
      if(docs.length > 0){
        res.status(200);
        res.send(docs);
      }else{
        res.status(404).send("not found");
      }
    });
});






// // Get /fridges and return the all of the fridges based on requested format
// router.get('/', (req,res)=> {
//     res.format({
// 		'text/html': ()=> {
// 			res.set('Content-Type', 'text/html');
// 			res.sendFile(path.join(__dirname,'public','view_pickup.html'),(err) =>{
// 				if(err) res.status(500).send('500 Server error');
// 			});
// 		},
// 		'application/json': ()=> {
// 			res.set('Content-Type', 'application/json');
//             res.json(req.app.locals.fridges);
//         },
//         'default' : ()=> {
//             res.status(406).send('Not acceptable');
//         }
//     })
// });
// // helper route, which returns the accepted types currently available in our application. This is used by the addFridge.html page
// router.get("/types", function(req, res, next){
// 	let types = [];
//   Object.entries(req.app.locals.items).forEach(([key, value]) => {
//     if(!types.includes(value["type"])){
//       types.push(value["type"]);
//     }
//   });
// 	res.status(200).set("Content-Type", "application/json").json(types);
// });
//
// // Middleware function: this function validates the contents of the request body associated with adding a new fridge into the application. At the minimimum, it currently validates that all the required fields for a new fridge are provided.
// function validateFridgeBody(req,res,next){
//     let properties = ['name','can_accept_items','accepted_types','contact_person','contact_phone','address'];
//
//     for(property of properties){
//       // hasOwnProperty method of an object checks if a specified property exists in the object. If a property does not exist, then we return a 400 bad request error
//         if (!req.body.hasOwnProperty(property)){
//             return res.status(400).send("Bad request check fridge");
//         }
//     }
//     // if all the required properties were provided, then we move to the next set of middleware and continue program execution.
//     next();
// }
// // Middleware function: this validates the contents of request body, verifies item data
// function validateItemBody(req,res,next){
//     let properties = ['id','quantity'];
//     for (property of properties){
//         if (!req.body.hasOwnProperty(property))
// 			return res.status(400).send("Bad request check item");
//     }
//     next();
// }
// // Adds a new fridge, returns newly created fridge
// router.post('/', validateFridgeBody, (req,res)=> {
// 	// Make local changes
// 	req.app.locals.fridges.push({id:`fg-${req.app.locals.fridges.length+1}`, ...req.body, items:[]});
//
// 	// Update 'database'
// 	fs.writeFile(path.join(__dirname, 'data','comm-fridge-data.json'),JSON.stringify(req.app.locals.fridges, null, 4), (err)=>{
//         if (err)
//             return res.status(500).send("Database error");
//         res.status(201).json({id:`fg-${req.app.locals.fridges.length}`, ...req.body});
//     });
// });
//
// // Get /fridges/{fridgeID}. Returns the data associated with the requested fridge.
// router.get("/:fridgeId", function(req, res, next){
// 	const fridges = req.app.locals.fridges;
// 	const items = req.app.locals.items;
//
// 	// Find fridge in 'database'
// 	const fridgeFound = fridges.find(f => f.id == req.params.fridgeId);
// 	if(!fridgeFound) return res.status(404).send('Not Found');
//
// 	// Make deep copy of fridges data
// 	let fridge = {...fridgeFound};
//
// 	// Populate items array with item data matched with itemID
// 	// TODO: IS THIS NEEDED??
// 	for (let i = 0; i < fridge.items.length; i++) {
// 		fridge.items[i] = {...items[fridge.items[i].id], ...fridge.items[i]};
// 	}
//
// 	res.json(fridge);
// });
//
// // Updates a fridge and returns the data associated.
// // Should probably also validate the item data if any is sent, oh well :)
// router.put("/:fridgeId", (req, res) =>{
// 	const fridges = req.app.locals.fridges;
// 	const items = req.app.locals.items;
//
// 	// Find fridge in 'database'
// 	let indexFound = fridges.findIndex(f => f.id == req.params.fridgeId);
// 	if(indexFound < 0) return res.status(404).send('Not Found');
// 	req.app.locals.fridges[indexFound] = {...req.app.locals.fridges[indexFound], ...req.body} // Should not need old attributes i.e. ...fridgeFound
//
// 	// Update 'database'
// 	fs.writeFile(path.join(__dirname, 'data','comm-fridge-data.json'),JSON.stringify(req.app.locals.fridges, null, 4), (err)=>{
// 		if (err)
// 			return res.status(500).send("Database error");
//
// 		// Populate items array with item data matched with itemID
// 		// TODO: is this needed?
// 		let fridge = req.app.locals.fridges[indexFound];
// 		for (let i = 0; i < fridge.items.length; i++) {
// 			fridge.items[i] = {...items[fridge.items[i].id], ...fridge.items[i]};
// 		}
//
//         res.json(req.app.locals.fridges[indexFound]); // Status 200 is default
//     });
//
// });
//
// // Adds an item to specified fridge
// router.post("/:fridgeId/items", validateItemBody, (req,res)=>{
// 	const fridges = req.app.locals.fridges;
// 	const items = req.app.locals.items;
//
// 	// Find fridge in 'database'
// 	let indexFound = fridges.findIndex(f => f.id == req.params.fridgeId);
// 	if(indexFound < 0) return res.status(404).send('Not Found');
//
// 	// Find item in 'database'
// 	if(!items.hasOwnProperty(req.body.id)) return res.status(404).send('Not Found');
//
// 	// Add item to fridge
// 	// ASSUMES ITEM DOES NOT EXIST IN ARRAY
// 	req.app.locals.fridges[indexFound].items.push(req.body)
//
// 	// Update 'database'
// 	fs.writeFile(path.join(__dirname, 'data','comm-fridge-data.json'),JSON.stringify(req.app.locals.fridges, null, 4), (err)=>{
// 		if (err)
// 			return res.status(500).send("Database error");
//
// 		res.json(req.body);
//     });
//
// })
//
// // Deletes an item from specified fridge
// router.delete("/:fridgeId/items/:itemId", (req,res)=>{
// 	const fridges = req.app.locals.fridges;
// 	const items = req.app.locals.items;
//
// 	// Find fridge in 'database'
// 	let indexFound = fridges.findIndex(f => f.id == req.params.fridgeId);
// 	if(indexFound < 0) return res.status(404).send('Not Found');
//
// 	// Find item in 'database'
// 	if(!items.hasOwnProperty(req.params.itemId)) return res.status(404).send('Not Found');
//
// 	// Remove item from fridge
// 	fridges[indexFound].items = fridges[indexFound].items.filter(item=> item.id != req.params.itemId)
//
// 	// Update 'database'
// 	fs.writeFile(path.join(__dirname, 'data','comm-fridge-data.json'),JSON.stringify(req.app.locals.fridges, null, 4), (err)=>{
// 		if (err)
// 			return res.status(500).send("Database error");
//
// 		res.status(204).send();
//     });
//
// })
//
// router.delete("/:fridgeId/items", (req,res)=>{
// 	const fridges = req.app.locals.fridges;
//
// 	// Find fridge in 'database'
// 	let indexFound = fridges.findIndex(f => f.id == req.params.fridgeId);
// 	if(indexFound < 0) return res.status(404).send('Not Found');
//
// 	// Delete all items in fridge
// 	if (!req.query.hasOwnProperty('id')){
// 		fridges[indexFound].items = [];
// 	}
// 	// Remove specific items from fridge
// 	else{
// 		fridges[indexFound].items = fridges[indexFound].items.filter(item=> !req.query.id.includes(item.id));
// 	}
// 	// Update 'database'
// 	fs.writeFile(path.join(__dirname, 'data','comm-fridge-data.json'),JSON.stringify(req.app.locals.fridges, null, 4), (err)=>{
// 		if (err)
// 			return res.status(500).send("Database error");
//
// 		res.status(204).send();
//     });
// })


module.exports = router;
