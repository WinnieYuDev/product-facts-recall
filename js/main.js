// psuedocode

// user enters product name or barcode
// use product name to fetch FDA recall info (latest only)
// use product name to fetch Open Food Facts info (name, company, categories, allergens, image)
// display both in left panel
// fetch recent 2025 food recalls news (top 10 latest) in right panel
// add catch errors

// main dom
let ul = document.querySelector("#productResults"); // left panel
let section = document.querySelector("#searchSection"); // show loading in section
let input = document.querySelector("#productInput"); // user input
let recallNewsList = document.querySelector("#recallNewsList"); // right panel news
let searchButton = document.querySelector("#searchButton");

searchButton.addEventListener("click", goFetch);

// load recent recall news on DOM load
window.addEventListener("DOMContentLoaded", function() {
    loadRecallNews();
});

// load recent food recall news 
function loadRecallNews() {
    recallNewsList.innerHTML = "Loading recent recalls...";

    let urlNews = "https://api.fda.gov/food/enforcement.json?search=report_date:[20250101+TO+20251231]+AND+product_type:\"Food\"&limit=10&sort=report_date:desc";
    
// fetch from FDA API
    fetch(urlNews)
    .then(res => res.json())
    .then(data=> {
        recallNewsList.innerHTML = "";

    // loop through top 10 recalls
    // looked this up. Referenced from Google AI Overview, Stack overflow, Co-Pilot Guidance
        if (!data.results || data.results.length === 0) {
            let li = document.createElement("li");
            li.textContent = "No recent food recalls";
            recallNewsList.appendChild(li);
            return;
        }
    // format date MM-DD-YYYY
        for (let i = 0; i < data.results.length; i++) {
            let item = data.results[i];
            let date = "";

            if (item.recall_initiation_date) {
                date = item.recall_initiation_date;
            }
            else if (item.report_date) {
                date = item.report_date;
            }

            if (date.length === 8){
                date = date.slice(4,6) + "-" + date.slice(6,8) + "-" + date.slice(0,4);
            }

        // city and state text
            let locationText = "";
            if (item.city){
                locationText += item.city + ", ";
            }

            if (item.state){
                locationText += item.state + " - ";
            }

        // reason text
            let reasonText = "";
            if (item.reason_for_recall){
                reasonText = item.reason_for_recall;
            }

        // create li element for each recall
            let li = document.createElement("li");
            li.className = "recall-news-item";

        // create title element for each recall
            let titleDiv = document.createElement("div");
            titleDiv.className = "recall-title";
            titleDiv.textContent = item.recall_title || item.product_description;

        // create location element
            let locationDiv = document.createElement("div");
            locationDiv.className = "recall-location";
            locationDiv.textContent = locationText;
        
        // create reason element
            let reasonDiv = document.createElement("div");  // <-- NEW
            reasonDiv.className = "recall-reason";
            reasonDiv.textContent = "Reason: " + reasonText        

        // create div element for each recall date
            let dateDiv = document.createElement("div");
            dateDiv.className = "recall-date";
            dateDiv.textContent = "Published: " + (date ? date : "N/A");

        // append to parent
            li.appendChild(titleDiv);
            li.appendChild(locationDiv);
            li.appendChild(reasonDiv)
            li.appendChild(dateDiv);
            recallNewsList.appendChild(li);
        }
    })
    .catch(function(err) {
        recallNewsList.innerHTML = "<li>Error loading recall news</li>";
        console.log("Error fetching recent FDA recalls:", err);
    });
}

// fetch product & recall info
function goFetch() {
    ul.innerHTML = "";
    section.innerText = "Loading...";
// user enters product name
    let productName = input.value.trim();
    if (productName === "") {
        alert("Please enter a product name or barcode.");
        section.innerText = "";
        return;
    }
// fetch FDA recalls using product name (latest 5)
    let urlFDA = "https://api.fda.gov/food/enforcement.json?search=product_description:\"" + encodeURIComponent(productName) + "\"&limit=5&sort=report_date:desc";
// fetch FDA AP
    fetch(urlFDA)
    .then(res => res.json())
    .then(dataFDA => {
        section.innerText = "";

        let li = document.createElement("li");
        li.className = "product-item";

        let recallDiv = document.createElement("div");
        recallDiv.className = "recall-info";

    // show latest recall if exists
        // looked this up. Referenced from Google AI Overview, Stack overflow, Co-Pilot Guidance
        if (dataFDA.results && dataFDA.results.length > 0) {
            let recall = dataFDA.results[0];
            let recallDate = "";
            if (recall.recall_initiation_date) {
                recallDate = recall.recall_initiation_date;
            }
            else if (recall.report_date) {
                recallDate = recall.report_date;
            }
            if (recallDate.length === 8) {
                recallDate = recallDate.slice(4,6) + "-" + recallDate.slice(6,8) + "-" + recallDate.slice(0,4);
            }

        // recall title
            let recallTitle = document.createElement("div");
            recallTitle.className = "recall-title";
            recallTitle.textContent = "Recall Product: " + recall.product_description;

        // recall reason
            let recallReason = document.createElement("div");
            recallReason.className = "recall-reason";
            recallReason.textContent = "Reason: " + recall.reason_for_recall;

        // recall date
            let recallDateDiv = document.createElement("div");
            recallDateDiv.className = "recall-date";
            recallDateDiv.textContent = "Date: " + (recallDate ? recallDate : "N/A");

        // recall location
            let locationText = "";
            if (recall.city) {
                locationText += recall.city + ", ";
            }
            if (recall.state) {
                locationText += recall.state;
            }
            let locationDiv = document.createElement("div");
            locationDiv.className = "recall-location";
            locationDiv.textContent = locationText;

        // append to parent
            recallDiv.appendChild(recallTitle);
            recallDiv.appendChild(recallReason);
            recallDiv.appendChild(recallDateDiv);
            recallDiv.appendChild(locationDiv);
        }
        else {
            recallDiv.textContent = "Recall: No recall at this time";
        }

// fetch Open Food Facts info
        let urlOFF = "https://world.openfoodfacts.org/cgi/search.pl?search_terms=" + encodeURIComponent(productName) + "&search_simple=1&action=process&json=1";
    // get first product if exists
        fetch(urlOFF)
        .then(res => res.json())
        .then(dataOFF => {
            let product = null;
            if (dataOFF.products && dataOFF.products.length > 0) {
                product = dataOFF.products[0];
            }

        // extract product info
            if (product && product.product_name) {
                name = product.product_name;
            } else {
                name = productName;
            }

            let company;
            if (product && product.brands) {
                company = product.brands;
            } else {
                company = "Unknown";
            }

        // extract allergens
            // looked this up. Referenced from Google AI Overview, Stack overflow, Co-Pilot Guidance
            let allergens = "None";
            if (product && product.allergens_tags && product.allergens_tags.length > 0) {
                let arr = [];
                for (let i = 0; i < product.allergens_tags.length; i++) {
                    arr.push(product.allergens_tags[i].replace("en:",""));
                }
                allergens = arr.join(", ");
            }

        // extract categories (first 3 English only)
            // looked this up. Referenced from Google AI Overview, Stack overflow, Co-Pilot Guidance
            let categories = "Other";
            if (product && product.categories_hierarchy && product.categories_hierarchy.length > 0) {
                let englishCats = [];
                for (let i = 0; i < product.categories_hierarchy.length; i++) {
                    if (product.categories_hierarchy[i].indexOf("en:") === 0){
                        englishCats.push(product.categories_hierarchy[i].replace("en:",""));
                    }
                    if (englishCats.length === 3){
                        break;
                    }
                }
                if (englishCats.length > 0) {
                    categories = englishCats.join(", ");
                }
            }

        // extract image
            let imageUrl = "";
            if (product && product.image_url){
                imageUrl = product.image_url;
            }

        // display product info and recall info
            let nameDiv = document.createElement("div");
            nameDiv.className = "product-name";
            nameDiv.textContent = "Name: " + name;

        //product category
            let categoryDiv = document.createElement("div");
            categoryDiv.className = "product-category";
            categoryDiv.textContent = "Category: " + categories;

        //product company
            let companyDiv = document.createElement("div");
            companyDiv.className = "product-company";
            companyDiv.textContent = "Company: " + company;

        //product allergens
            let allergenDiv = document.createElement("div");
            allergenDiv.className = "product-allergens";
            allergenDiv.textContent = "Allergens: " + allergens;

        // append to parent
            li.appendChild(nameDiv);
            li.appendChild(categoryDiv);
            li.appendChild(companyDiv);
            li.appendChild(allergenDiv);

        // product img
            if (imageUrl !== "") {
                let img = document.createElement("img");
                img.src = imageUrl;
                img.alt = name;
                img.className = "product-image";
                li.appendChild(img);
            }

        // append to parent
            li.appendChild(recallDiv);
            ul.appendChild(li);
        })

// catch error if Open Food Facts fails
        .catch(err => {
            console.log("Open Food Facts fetch failed:", err);
            //can show recall information if product details fail
            li.appendChild(recallDiv);
            ul.appendChild(li);
        });

    })
// catch error if all fails
    .catch(err => {
        section.innerText = "";
        alert("FDA recall search failed. Try again later.");
        console.log("FDA fetch error:", err);
    });
}

// Citation:
// Guidance for code syntax and code debug from Google AI Overview, Learning Mode of Claude, Co-Pilot Guidance, StackOverflow
// Referenced from Tutorial - https://www.youtube.com/watch?v=b5rjEW-_6po and https://www.youtube.com/watch?v=G7XJRLaq2Cw
