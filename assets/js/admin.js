jQuery(document).ready(function($) {
    // Initialize color pickers
    $(".mbm-color-picker").wpColorPicker();
    
    // Menu items management
    var itemIndex = $("#mbm-menu-items .mbm-menu-item-row").length;
    
    $("#mbm-add-item").click(function() {
        var html = `<div class="mbm-menu-item-row" data-index="${itemIndex}">
            <table class="form-table">
                <tr>
                    <td><label>Label:</label></td>
                    <td><input type="text" name="mbm_options[menu_items][${itemIndex}][label]" value="" /></td>
                </tr>
                <tr>
                    <td><label>Icon Class:</label></td>
                    <td><input type="text" name="mbm_options[menu_items][${itemIndex}][icon]" value="" placeholder="fas fa-home" /></td>
                </tr>
                <tr>
                    <td><label>URL:</label></td>
                    <td><input type="url" name="mbm_options[menu_items][${itemIndex}][url]" value="" /></td>
                </tr>
                <tr>
                    <td><label>Target:</label></td>
                    <td>
                        <select name="mbm_options[menu_items][${itemIndex}][target]">
                            <option value="_self">Same Window</option>
                            <option value="_blank">New Window</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td><label>Badge:</label></td>
                    <td><input type="text" name="mbm_options[menu_items][${itemIndex}][badge]" value="" placeholder="New" /></td>
                </tr>
                <tr>
                    <td colspan="2">
                        <button type="button" class="button mbm-remove-item">Remove Item</button>
                    </td>
                </tr>
            </table>
        </div>`;
        $("#mbm-menu-items").append(html);
        itemIndex++;
    });
    
    $(document).on("click", ".mbm-remove-item", function() {
        $(this).closest(".mbm-menu-item-row").remove();
    });
});