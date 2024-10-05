import os
import cv2
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Đường dẫn đến thư mục chứa các dataset (static/)
BASE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'api','static'))

# Hàm tính histogram
def calculate_histogram(image):
    histograms = []
    for i in range(3):  # Tính histogram cho từng kênh B, G, R
        hist = cv2.calcHist([image], [i], None, [256], [0, 256])
        cv2.normalize(hist, hist)
        histograms.append(hist)
    return histograms

# Hàm tính khoảng cách Euclidean giữa 2 histogram
def euclidean_distance(hist1, hist2):
    distance = 0
    for h1, h2 in zip(hist1, hist2):
        distance += np.sqrt(np.sum((h1 - h2) ** 2))
    return distance

# Hàm tìm các ảnh tương tự
def find_similar_images(input_image_path, folder_path):
    input_image = cv2.imread(input_image_path)
    input_image = cv2.cvtColor(input_image, cv2.COLOR_BGR2RGB)
    # input_image_gray = cv2.cvtColor(input_image, cv2.COLOR_BGR2GRAY)
    input_hist = calculate_histogram(input_image)

    distances = []
    for filename in os.listdir(folder_path):
        image_path = os.path.join(folder_path, filename)
        test_image = cv2.imread(image_path) 
        test_image =cv2.cvtColor(test_image, cv2.COLOR_BGR2RGB)

        test_hist = calculate_histogram(test_image)
        distance = euclidean_distance(input_hist, test_hist)
        distances.append((filename, distance,test_image))

    distances.sort(key=lambda x: x[1])
    return distances[:10]

@app.route('/api/datasets', methods=['GET'])
def get_datasets():
    print("Fetching datasets...")
    # Tạo danh sách các dataset (dataset.part1, dataset.part2,...)
    datasets = [f'dataset.part{i}' for i in range(1, 6)]
    return jsonify(datasets)


@app.route('/api/images', methods=['POST'])
def get_images():
    data = request.json
    dataset = data['dataset']
    category = data['category']
    folder_type = data['folder_type']

    folder_path = os.path.join(BASE_PATH, dataset, folder_type, category)
    print(f"dataset images from: {folder_type}")
    # Debug: Log the folder path
    print(f"Fetching images from: {folder_path}")

    if not os.path.exists(folder_path):
        return jsonify({"error": "Invalid path"}), 400

    images = os.listdir(folder_path)
    return jsonify(images)

@app.route('/api/find_similar', methods=['POST'])
def find_similar():
    data = request.json
    dataset = data['dataset']
    category = data['category']
    image_name = data['image_name']

    seg_test_folder = os.path.join(BASE_PATH, dataset, 'seg_test', category)
    seg_folder = os.path.join(BASE_PATH, dataset, 'seg', category)

    input_image_path = os.path.join(seg_test_folder, image_name)
    if not os.path.exists(input_image_path):
        return jsonify({"error": "Image not found"}), 404

    similar_images = find_similar_images(input_image_path, seg_folder)

    # Chuyển đổi các giá trị float32 thành float
    similar_images = [(image[0], float(image[1])) for image in similar_images]
    
    return jsonify(similar_images)

# Đường dẫn để phục vụ các tệp tĩnh như hình ảnh
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(BASE_PATH, filename)

if __name__ == '__main__':
    app.run(debug=True)
