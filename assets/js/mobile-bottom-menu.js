jQuery(document).ready(function($) {
    // Initialize
    initializeMobileMenu();
    initializeMobileCart();
    
    function initializeMobileMenu() {
        if ($(".mbm-mobile-menu").length) {
            $("body").addClass("mbm-menu-active");
        }
    }
    
    function initializeMobileCart() {
        if ($(".mbm-mobile-cart").length) {
            $("body").addClass("mbm-cart-active");
            setupCartFunctionality();
        }
    }
    
    function setupCartFunctionality() {
        // Quantity controls
        $(".mbm-qty-plus").click(function() {
            var input = $(this).siblings(".mbm-quantity");
            var currentVal = parseInt(input.val());
            var maxVal = parseInt(input.attr("max"));
            
            if (currentVal < maxVal) {
                input.val(currentVal + 1);
            }
        });
        
        $(".mbm-qty-minus").click(function() {
            var input = $(this).siblings(".mbm-quantity");
            var currentVal = parseInt(input.val());
            var minVal = parseInt(input.attr("min"));
            
            if (currentVal > minVal) {
                input.val(currentVal - 1);
            }
        });
        
        // Variation handling
        $(".mbm-variation-select").change(function() {
            updateVariationPrice();
        });
        
        // Add to cart
        $(".mbm-add-to-cart-btn").click(function() {
            handleAddToCart($(this), false);
        });
        
        // Buy now
        $(".mbm-buy-now-btn").click(function() {
            handleAddToCart($(this), true);
        });
    }
    
    function updateVariationPrice() {
        var allSelected = true;
        var variations = {};
        var productId = $(".mbm-mobile-cart").data("product-id");
        
        $(".mbm-variation-select").each(function() {
            var name = $(this).attr("name");
            var value = $(this).val();
            if (value) {
                variations["attribute_" + name] = value;
            } else {
                allSelected = false;
            }
        });
        
        if (allSelected && Object.keys(variations).length > 0) {
            // Show loading state
            $(".mbm-selected-price").show().text("Updating price...");
            $(".mbm-price-range").hide();
            
            $.ajax({
                url: mbm_ajax.ajax_url,
                type: "POST",
                data: {
                    action: "mbm_get_variation_data",
                    product_id: productId,
                    variations: variations,
                    nonce: mbm_ajax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        var data = response.data;
                        $(".mbm-selected-price").html(data.price_html);
                        
                        // Update discount badge
                        if (data.is_on_sale && data.discount_percentage > 0) {
                            $(".mbm-discount-badge").show().text(data.discount_percentage + "% OFF");
                        } else if (data.is_on_sale) {
                            $(".mbm-discount-badge").show().text("SALE");
                        } else {
                            $(".mbm-discount-badge").hide();
                        }
                        
                        // Update stock
                        if (!data.is_in_stock) {
                            $(".mbm-add-to-cart-btn, .mbm-buy-now-btn").prop("disabled", true);
                            showNotification("This variation is out of stock", "error");
                        } else {
                            $(".mbm-add-to-cart-btn, .mbm-buy-now-btn").prop("disabled", false);
                            
                            // Update quantity max
                            if (data.stock_quantity) {
                                $(".mbm-quantity").attr("max", data.stock_quantity);
                            }
                        }
                        
                        // Store variation ID for add to cart
                        $(".mbm-mobile-cart").data("variation-id", data.variation_id);
                        
                    } else {
                        $(".mbm-selected-price").text("Price not available");
                        $(".mbm-discount-badge").hide();
                    }
                },
                error: function() {
                    $(".mbm-selected-price").text("Error loading price");
                    $(".mbm-discount-badge").hide();
                }
            });
        } else {
            $(".mbm-price-range").show();
            $(".mbm-selected-price").hide();
            $(".mbm-mobile-cart").removeData("variation-id");
            
            // Reset discount badge to original state
            var originalBadge = $(".mbm-discount-badge").data("original-text");
            if (originalBadge) {
                $(".mbm-discount-badge").show().text(originalBadge);
            }
        }
    }
    
    function handleAddToCart(button, buyNow) {
        var productId = button.data("product-id");
        var quantity = $(".mbm-quantity").val() || 1;
        var variations = {};
        var variationId = $(".mbm-mobile-cart").data("variation-id") || 0;
        
        // Get variation data
        $(".mbm-variation-select").each(function() {
            var name = $(this).attr("name");
            var value = $(this).val();
            if (value) {
                variations["attribute_" + name] = value;
            }
        });
        
        // Validate variations
        if ($(".mbm-variation-select").length > 0) {
            var allSelected = true;
            $(".mbm-variation-select").each(function() {
                if (!$(this).val()) {
                    allSelected = false;
                    return false;
                }
            });
            
            if (!allSelected) {
                showNotification("Please select all product options", "error");
                return;
            }
        }
        
        // Disable button and show loading
        button.prop("disabled", true).addClass("mbm-loading");
        var originalText = button.find("span").text();
        button.find("span").text(buyNow ? "Processing..." : "Adding...");
        
        $.ajax({
            url: mbm_ajax.ajax_url,
            type: "POST",
            data: {
                action: "mbm_add_to_cart",
                product_id: productId,
                quantity: quantity,
                variation_id: variationId,
                variations: variations,
                nonce: mbm_ajax.nonce
            },
            success: function(response) {
                if (response.success) {
                    if (buyNow) {
                        window.location.href = mbm_ajax.checkout_url;
                    } else {
                        button.find("span").text("Added!");
                        showNotification("Product added to cart!", "success");
                        
                        // Update cart count
                        updateCartCount(response.data.cart_count);
                        
                        setTimeout(function() {
                            button.prop("disabled", false).removeClass("mbm-loading").find("span").text(originalText);
                        }, 2000);
                    }
                } else {
                    showNotification(response.data || "Failed to add product", "error");
                    button.prop("disabled", false).removeClass("mbm-loading").find("span").text(originalText);
                }
            },
            error: function() {
                showNotification("An error occurred", "error");
                button.prop("disabled", false).removeClass("mbm-loading").find("span").text(originalText);
            }
        });
    }
    
    function updateCartCount(count) {
        $(".mbm-badge").each(function() {
            var $this = $(this);
            var parentLink = $this.closest("a");
            if (parentLink.attr("href").indexOf("cart") !== -1) {
                $this.text(count);
            }
        });
        
        // Trigger WooCommerce cart fragments update
        if (typeof wc_add_to_cart_params !== "undefined") {
            $(document.body).trigger("wc_fragment_refresh");
        }
    }
    
    function showNotification(message, type) {
        // Remove existing notifications
        $(".mbm-notification").remove();
        
        var notification = $("<div class=\"mbm-notification mbm-" + type + "\">" + message + "</div>");
        $("body").append(notification);
        
        setTimeout(function() {
            notification.addClass("show");
        }, 100);
        
        setTimeout(function() {
            notification.removeClass("show");
            setTimeout(function() {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Handle window resize
    $(window).resize(function() {
        if ($(".mbm-mobile-menu").length) {
            $("body").addClass("mbm-menu-active");
        } else {
            $("body").removeClass("mbm-menu-active");
        }
        
        if ($(".mbm-mobile-cart").length) {
            $("body").addClass("mbm-cart-active");
        } else {
            $("body").removeClass("mbm-cart-active");
        }
    });
    
    // Menu item active state
    $(".mbm-menu-item").click(function() {
        $(".mbm-menu-item").removeClass("active");
        $(this).addClass("active");
    });
    
    // Set active menu item based on current page
    var currentUrl = window.location.href;
    $(".mbm-menu-item").each(function() {
        if ($(this).attr("href") === currentUrl) {
            $(this).addClass("active");
        }
    });
    
    // Store original discount badge text
    $(".mbm-discount-badge").each(function() {
        $(this).data("original-text", $(this).text());
    });
});