const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const _ = require("lodash")

dotenv.config({path:'./config.env'});
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URL, {useNewUrlParser : true});

const itemSchema = mongoose.Schema({
  itemName : String
});

const Item =mongoose.model("Item", itemSchema);

const Item1 = new Item({
  itemName : "Collect books"
})
const Item2 = new Item({
  itemName : "Make lunch"
})
const Item3 = new Item({
  itemName : "Buy cloths"
})

const listSchema = mongoose.Schema({
  name : String,
  items : [itemSchema]
})

const List = mongoose.model("List", listSchema);

const defaultItem = [Item1, Item2, Item3];

app.get("/", function(req, res) {

  Item.find({}, function(err, listItem){

      if(listItem.length === 0){
        Item.insertMany(defaultItem, function(err){
          if(err) console.log(err);
          else {
            // mongoose.connection.close();
            console.log("List added succesfully");
          }
        });

        res.redirect("/");
      }
      else{
      res.render("list", {listTitle: "Today", newListItems: listItem});
      }
  });
  

});

app.get("/:customList", function(req,res){
  const customListName = _.capitalize(req.params.customList);

  List.findOne({name : customListName},function(err,foundList){
    if(err){
      console.log(err);
    }
    else{
      if(!foundList){
        //  Create a new List
        const list = new List({
          name : customListName,
          items : defaultItem 
        })
        list.save(); 
        res.redirect("/"+ customListName);
      }
      else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })
})

app.post("/", function(req, res){

    const addItem = req.body.newItem;
    const listName = req.body.list;

    const newItems = new Item({
      itemName : addItem
    });

    if(listName === "Today"){
      newItems.save();
      res.redirect("/");
    }
    else{
      List.findOne({name : listName}, function(err, foundList){
         foundList.items.push(newItems);
         foundList.save();
         res.redirect("/"+ listName); 
      })
    }
});

app.post("/delete", function(req,res){
  // console.log(req.body.checkbox);
  const deleteItem = req.body.checkbox;
  const listName = req.body.listName;

  if(listName==='Today'){
    Item.findByIdAndRemove(deleteItem,function(err){
      if(err) console.log(err);
      else console.log("Item Removed Succesfully");
    })
    res.redirect("/")
  }
  else {
    List.findOneAndUpdate({name : listName},{$pull : {items :{_id : deleteItem}}},function(err,foundList){
      if(err) console.log(err);
      else{
        console.log("Succesfully Deleted");
        res.redirect("/"+listName);
      }
    })
  }
 
})


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});