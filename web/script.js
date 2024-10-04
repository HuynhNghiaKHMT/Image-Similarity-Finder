document.addEventListener('DOMContentLoaded', function () {
    const datasetSelector = document.getElementById('dataset-selector');
    const categorySelector = document.getElementById('category-selector');
    const imageContainer = document.getElementById('seg-test-images');
    const similarImageContainer = document.getElementById('similar-images');
    const findSimilarButton = document.getElementById('find-similar');
    
    let selectedDataset = '';
    let selectedCategory = '';
    let selectedImage = '';

    // Fetch dataset list on page load
    fetch('https://l85sgcpw-5000.asse.devtunnels.ms/api/datasets')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(datasets => {
        datasets.forEach(dataset => {
            const option = document.createElement('option');
            option.value = dataset;
            option.text = dataset;
            datasetSelector.appendChild(option);
        });
    })
    .catch(error => console.error('Error fetching datasets:', error));

    // Event listener for dataset selection
    datasetSelector.addEventListener('change', function () {
        selectedDataset = datasetSelector.value;
        // if (selectedDataset === "") {
        //     return; // Do nothing if no valid dataset is selected
        // }
        similarImageContainer.innerHTML = '';
        loadImages(); // Reload images when dataset changes
    });

    // Event listener for category selection
    categorySelector.addEventListener('change', function () {
        selectedCategory = categorySelector.value;
        similarImageContainer.innerHTML = '';
        loadImages(); // Reload images when category changes
    });

    // Function to load images based on selected dataset and category
    function loadImages() {
        if (selectedDataset && selectedCategory) {
            fetch('https://l85sgcpw-5000.asse.devtunnels.ms/api/images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dataset: selectedDataset,
                    category: selectedCategory,
                    folder_type: 'seg_test' // Load images from seg_test by default
                }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(images => {
                    imageContainer.innerHTML = ''; // Clear previous images
                    if (Array.isArray(images) && images.length > 0) {
                        images.forEach(image => {
                            const imgElement = document.createElement('img');
                            const imagePath = `https://l85sgcpw-5000.asse.devtunnels.ms/static/${selectedDataset}/seg_test/${selectedCategory}/${image}`;
                            imgElement.src = imagePath;
                            imgElement.alt = image;
                            imgElement.classList.add('selectable-image');
                            
                            // Debug: Log the image path
                            console.log(`Loading image: ${imagePath}`);
                            
                            // Add click event to select image
                            imgElement.addEventListener('click', function () {
                                selectedImage = image;
                                document.querySelectorAll('.selectable-image').forEach(img => img.classList.remove('selected'));
                                imgElement.classList.add('selected');
                            });
    
                            imageContainer.appendChild(imgElement);
                        });
                    } else {
                        console.error('No images found for the selected dataset and category');
                    }
                })
                .catch(error => console.error('Error fetching images:', error));
        }
    }
    
     

    // Event listener for "Find Similar" button
    findSimilarButton.addEventListener('click', function () {
        if (selectedImage && selectedDataset && selectedCategory) {
            fetch('https://l85sgcpw-5000.asse.devtunnels.ms/api/find_similar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dataset: selectedDataset,
                    category: selectedCategory,
                    image_name: selectedImage
                }),
            })
                .then(response => response.json())
                .then(similarImages => {
                    similarImageContainer.innerHTML = ''; // Clear previous similar images
                    similarImages.forEach(image => {
                        const imgElement = document.createElement('img');
                        imgElement.src = `https://l85sgcpw-5000.asse.devtunnels.ms/static/${selectedDataset}/seg/${selectedCategory}/${image[0]}`;
                        imgElement.alt = image[0];
                        imgElement.title = `Distance: ${image[1].toFixed(2)}`;
                        imgElement.classList.add('similar-image');
                        similarImageContainer.appendChild(imgElement);
                    });
                })
                .catch(error => console.error('Error finding similar images:', error));
        } else {
            alert('Please select an image from the test set!');
        }
    });
});
