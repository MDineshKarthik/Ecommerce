const express = require("express");
const app = express();
const path = require('path');
const engine = require("ejs-mate");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/dinesh').then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define product schema
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: String,
    price: Number,
    category: String
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
});

const Order = mongoose.model("Order", orderSchema);


const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }]
});


let adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: String,
    phone: Number,
    password: String
})


let Admin = mongoose.model("Admin",adminSchema);
const Product = mongoose.model("Product", productSchema);
const User = mongoose.model("User", userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'edhookati',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/dinesh' })
}));
app.engine('ejs', engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


// Middleware to store user info in res.locals
app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            if (user) {
                res.locals.currentUser = user;
                console.log("Current user set in res.locals:", res.locals.currentUser);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    } else {
        res.locals.currentUser = null; // Ensure currentUser is defined
    }
    next();
});
app.use(async (req, res, next) => {
    if (req.session.adminId) {
        try {
            const admin = await Admin.findById(req.session.adminId);
            if (admin) {
                res.locals.currentAdmin = admin;
                console.log("Current user set in res.locals:", res.locals.currentAdmin);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    } else {
        res.locals.currentAdmin = null; // Ensure currentUser is defined
    }
    next();
});






// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.render('user/login');
    }
};
const isAdminLoggedIn = (req,res,next)=>{
    if(req.session.adminId){
        next();
    }else{
        res.render("admin/login")
    }
}



// Login routes
app.get("/login", (req, res) => {
    res.render('user/login');
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (user) {
            req.session.userId = user._id; // Set user in session
            res.redirect('/');
        } else {
            res.send("Invalid credentials");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Signup routes
app.get("/signup", (req, res) => {
    res.render("user/signup");
});

app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.render('user/login');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Logout route
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.render('user/login');
    });
});

// Product routes
app.get("/allproducts", async (req, res) => {
    try {
        const prods = await Product.find({});
        res.render("products/allproducts", { prods });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/mobiles", async (req, res) => {
    try {
        const prods = await Product.find({ category: "mobile" });
        res.render("products/allproducts", { prods });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/laptops", async (req, res) => {
    try {
        const prods = await Product.find({ category: "laptop" });
        res.render("products/allproducts", { prods });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/watches", async (req, res) => {
    try {
        const prods = await Product.find({ category: "watch" });
        res.render("products/allproducts", { prods });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/tvs", async (req, res) => {
    try {
        const prods = await Product.find({ category: "tv" });
        res.render("products/allproducts", { prods });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Add to cart route
app.post("/add-to-cart/:productId", isLoggedIn, async (req, res) => {
    const { productId } = req.params;
    const userId = req.session.userId;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Check if product already exists in the cart
        if (user.cart.includes(productId)) {
            return res.send("Product already in cart");
        }

        // Add product to user's cart
        user.cart.push(productId);
        await user.save();

        res.redirect("/allproducts");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Remove from cart route
app.post("/remove-from-cart/:productId", isLoggedIn, async (req, res) => {
    const { productId } = req.params;
    const userId = req.session.userId;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Remove product from user's cart
        user.cart.pull(productId);
        await user.save();

        res.redirect("/cart");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// View cart route
app.get("/cart", isLoggedIn, async (req, res) => {
    const userId = req.session.userId;

    try {
        const user = await User.findById(userId).populate('cart');
        if (!user) {
            return res.status(404).send("User not found");
        }

        res.render("user/cart", { user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Home route
app.get("/", (req, res) => {
    console.log("Rendering home with currentUser:", res.locals.currentUser);
    res.render("products/home");
});

// Place order route
app.post("/place-order", isLoggedIn, async (req, res) => {
    const userId = req.session.userId;

    try {
        const user = await User.findById(userId).populate('cart');
        if (!user) {
            return res.status(404).send("User not found");
        }

        const products = user.cart;
        const totalAmount = products.reduce((sum, product) => sum + product.price, 0);

        const newOrder = new Order({
            user: user._id,
            products: products.map(product => product._id),
            totalAmount
        });

        await newOrder.save();

        user.orders.push(newOrder._id);
         // Empty the cart after placing the order
        await user.save();

        res.render("user/order", { order: newOrder });
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).send("Internal Server Error");
    }
});







//admin-routes

app.get("/admin-home",isAdminLoggedIn,async(req,res)=>{
    let products = await Product.find({})
    res.render("admin/home",{products})
})



app.get("/admin-login",isAdminLoggedIn,(req,res)=>{

    res.render("admin/login")
})
app.post("/admin-login",async (req,res)=>{
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email, password });
        if (admin) {
            req.session.adminId = admin._id; // Set admin in session
            res.redirect('/admin-home');
        } else {
            res.send("Invalid credentials");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
})

app.get("/admin-signup",(req,res)=>{
    res.render("admin/signup")
})

app.post("/admin-signup", async (req, res) => {
    let { name, email, phone, password } = req.body;
    try {
        let newAdmin = new Admin({ name, email, phone, password });
        await newAdmin.save();
        res.redirect('/admin-home');
    } catch (error) {
        console.error("Error signing up admin:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.get("/admin-logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.render('admin/login');
    });
});

app.get('/add-new-prod',isAdminLoggedIn,(req,res)=>{
    res.render('admin/newprod')
})

app.post('/add-new-prod',async(req,res)=>{
    let {name,image,price,category} = req.body

    let newprod = new Product({name,image,price,category})

    await newprod.save()

    res.redirect("/admin-home")

})

app.get('/remove-prod',async(req,res)=>{
    let products = await Product.find({})
    res.render('admin/remove',{products})
})

app.post("/remove-prod/:prodId", async (req, res) => {
    try {
        const { prodId } = req.params;
        
        const deletedProduct = await Product.findByIdAndDelete(prodId);
        
        if (!deletedProduct) {
            return res.status(404).send("Product not found");
        }
        res.redirect("/remove-prod")
    } catch (error) {
        console.error("Error removing product:", error);
        res.status(500).send("Internal Server Error");
    }
});

// View all orders (Admin only)
app.get("/admin-orders", isAdminLoggedIn, async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user').populate('products');
        res.render("admin/orders", { orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Internal Server Error");
    }
});




// Start the server on port 8080
app.listen(8080, () => {
    console.log("App is running on port 8080");
});
