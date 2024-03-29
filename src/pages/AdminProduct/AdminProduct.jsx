import { useForm } from "react-hook-form"; // LIBRERIA DE REACT
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import defaultPicture from "../../assets/images/avatar/usuario.jpg";
import formatDate from "../../utils/formatDate";
const TOKEN = localStorage.getItem("token");


const URL = import.meta.env.VITE_SERVER_URL;

export default function AdminProduct() {
	const { register, handleSubmit, setValue } = useForm();
	// State to hold the product data *-Usamos el useStategancho para crear una variable de estado dbproducts y una función setDbUserspara actualizarla.
	const [dbProducts, setDbProducts] = useState([]); // Estado() inicializado como un array vacio.
	const [productId, setProductId] = useState(); // deshabilitar el Password al editar
	const [categories, setCategories] = useState([]);
	const [totalButtons, setTotalButtons] = useState([]);
	const [limit, setLimit] = useState(10);
	const navigate = useNavigate();


	// -Enviar datos(data) al back con body de la request POST y llamar al endpoint POST /products
	async function submitedData(data) {
		try {
			const formData = new FormData();
            formData.append("producto", data.producto)
            formData.append("descripcion", data.descripcion)
            formData.append("category", data.category)
            formData.append("precio", data.precio)
        

            if (data.image && data.image.length > 0 && data.image[0] instanceof File) {
                formData.append("image", data.image[0]);
            }


			
			// -PUT: EDITAR (actualizar )producto
			if (productId) {
				if (!TOKEN) return; // si NO HAY TOKEN cancelo

				const response = await axios.put(
					`${URL}/products/${productId}`,
					formData,
					{ headers: { authorization: TOKEN } },
				);
				Swal.fire({
					icon: "success",
					title: "Producto editado correctamente ",
					text: `El producto ${response.data.product?.producto} fue editado correctamente`,
				});
				getProducts();
				setProductId(null);
				return; // para que mi codigo que sigue luego del if no se ejecute.
			}

			// -POST: CREAR producto
			const response = await axios.post(`${URL}/products`, formData,
			{ headers: { authorization: TOKEN } },);
			// enviamos al back
			// console.log(response);
			Swal.fire({
				icon: "success",
				title: "Producto creado ",
				text: `El producto ${response.data.product.producto} fue creado correctamente`,
			});
			getProducts();
			
		} catch (error) {
			console.log(error);
			Swal.fire({
				icon: "error",
				title: "No se creo producto",
				text: "Algunos datos ingresados no son correctos",
			});
			if (error.response.status === 401) {
				// logout()
				localStorage.removeItem("currentUser");
				localStorage.removeItem("token");
				navigate("/");
			}
		}
	}

	// -Obtener Usuarios
	// valor de page si no recibo nada es 0
	async function getProducts(page = 0) {
		try {
			// bsck le mando queryparams :page, limit
			const response = await axios.get(
				`${URL}/products?page=${page}&limit=${limit}`,
			);
			const products = response.data.products;
			const total = response.data.total; // 6
			// redondeo hacia arriba
			const buttonsQuantity = Math.ceil(total / limit); // 6/2=3 botones

			const arrayButtons = []; // itero en el template de react
			for (let i = 0; i < buttonsQuantity; i++) {
				arrayButtons.push(i);
			}

			setTotalButtons(arrayButtons);

			setDbProducts(products);
		} catch (error) {
			console.log(error);
			Swal.fire({
				icon: "error",
				title: "No se pudieron obtener los productos",
			});
		}
	}

	async function deleteProduct(id) {
		Swal.fire({
			title: "Confirma borrar el producto",
			text: `Realmente desea borrar el producto ${id}`,
			icon: "warning",
			showDenyButton: true,
			confirmButtonText: "Borrar",
			confirmButtonColor: "#e06262",
			denyButtonText: `Cancelar`,
			// reverseButtons: true, // invertir botones borrar y cancelar
		}).then(async function (resultado) {
			if (resultado.isConfirmed) {
				try {
					// const TOKEN = localStorage.getItem("token");
					if (!TOKEN) return;
					// console.log(`usuario a borrar ${id}`);
					// -Borrar Productos en la BD
					await axios.delete(`${URL}/products/${id}`, {
						headers: { authorization: TOKEN }, // objeto opciones, tiene la propiedad header{}
					});
					Swal.fire({
						icon: "success",
						title: "Producto borrado",
						text: `El producto ${id} fue borrado correctamente`,
						timer: 1500,
					});
					// -Actualizar el estado de Productos
					getProducts();
				} catch (error) {
					Swal.fire({
						icon: "error",
						title: "Error al borrar el producto",
						text: `No se pudo borrar el producto ${id}`,
					});
					if (error.response.status === 401) return logout();
				}
			} // cierra if
		}); // cierra then
	}

	function logout() {
		localStorage.removeItem("currentUser");
		localStorage.removeItem("token");
		navigate("/");
	}

	useEffect(
		function () {
			// controlo la carga de usuario
			getProducts();
			getCategories();
			// prevengo el bucle infinito
		},
		[limit],
	); // cuando el limite se actualice vuelva a llamar a getProducts

	async function getCategories() {
		try {
			const response = await axios.get("http://localhost:3000/categories");
			const categoriesDB = response.data.categories;
			// console.log(response);

			// setear un estado que maneje las categorias RECIBIDAS DE BD
			setCategories(categoriesDB);
		} catch (error) {
			console.log("No se pudieron obtener las categorias");
		}
	}

	function setFormValue(product) {
		// iteramos propiedades de los objetos
		console.log(product);
		setProductId(product._id);
		setValue("producto", product.producto);
		setValue("descripcion", product.descripcion);
		setValue("precio", product.precio);
		setValue("image", product.image || ""); // si es null or undefined que se setee un string vacio
		setValue("active", product.active);
		setValue("category", product.category._id || "");
	}

	// -Buscador (Peticion) a mi servidor para buscar productos
	async function handleSearch(e) {
		try {
			const search = e.target.value; // tomamos el evento del input
			if (!search) getProducts(); // si mi input quedo vacio (""), que me traiga todos los productos

			if (search.length <= 2) return; // que busque solo a partir de 2 letras
			const response = await axios.get(`${URL}/products/search/${search}`);
			const products = response.data.products;
			setDbProducts(products); // actualizamos los productos buscados.
		} catch (error) {
			console.log(error);
		}
	}

	return (
		<>
			<main className="main-container">
				<div className="admin-container">
					<section className="form-container">
						
						<form
							id="user-form"
							onSubmit={handleSubmit(submitedData)}
							encType="multipart/form-data"
						>
							<div className="input-wrapper">
								<label htmlFor="producto">Producto</label>
								<input
									type="text"
									{...register("producto")}
									id="producto"
									minLength="5"
									maxLength="60"
									required
									autoFocus
								/>
							</div>
							<div className="input-wrapper">
								<label htmlFor="descripcion">Descripcion</label>
								<textarea
									{...register("descripcion")}
									id="descripcion"
									required
								></textarea>
							</div>
							<div className="input-wrapper">
								<label htmlFor="precio">Precio</label>
								<input
									type="number"
									{...register("precio")}
									id="precio"
									required
								/>
							</div>
							<div className="input-wrapper">
								<label htmlFor="fecha">Fecha</label>
								<input
									type="date"
									{ ...register("fecha") }
									id="fecha"
									min=" 1930-01-01"
								/>
							</div>
							<div className="input-wrapper">
								<label htmlFor="image">Imagen</label>
								<input className="product-image"
									type="file" // -Upload type=file
									accept="image/*" // mostrar archivos de tipo imagen
									{...register("image")}
									
								/>
							</div>
							<div className="active">
								<label htmlFor="active">Activo</label>
								<input type="checkbox" {...register("active")} id="active" />
							</div>

							<div className="input-wrapper" {...register("category")}>
								<label htmlFor="category">Categoria</label>
								<select name="category" id="category">
									{categories.map((category) => (
										<option key={category._id} value={category._id}>
											{category.name}
										</option>
									))}
								</select>
							</div>

							<button
								type="submit"
								className={productId ? "btn-success" : "btn-form"}
							>
								{
									productId ? "Editar producto" : "Agregar producto" // existe id Editar, no existe Añadir
								}
							</button>
						</form>
					</section>

					{/* TABLA */}
					<section className="table-container">
						<div className="flex-between">
							{/* <h2>Tabla de Productos</h2> */}
							<div className="input-group">
								<input
									type="text"
									className="input-search"
									id="search"
									placeholder="Buscar por nombre"
									onKeyUp={handleSearch} // ejecuta la funcion y manda el evento keyup(cada vez que aprieta la tecla)
								/>
							</div>
						</div>
						<table className="user-table" id="userTable">
							<thead>
								<tr className="table-head">
									<th>Imagen</th>
									<th>Producto</th>
									<th>Descripcion</th>
									<th>Precio</th>
									<th>Fecha</th>
									<th>Categoria</th>
									<th>Acciones</th>
								</tr>
							</thead>
							<tbody id="table-body">
								{dbProducts.map((product) => {
									return (
										<tr key={product._id}>
											<td>
												<img
													className="tablePicture"
													src={
														product.image
															? `${URL}/images/products/${product.image}`
															: defaultPicture
													}
												/>
											</td>
											<td> {product.producto}</td>
											<td> {product.descripcion} </td>
											<td> {product.precio}</td>
											<td> {formatDate(product.fecha)}</td>
											{
												<td>
													{" "}
													{product.category
														? product.category.name
														: "SIN CATEGORIA"}
												</td>
											}

											<td>
												<button
													className="action-btn btn-danger"
													onClick={() => deleteProduct(product._id)}
													title="Borrar producto"
												>
													<i className="fa-solid fa-trash-can"></i>
												</button>

												<button
													className="action-btn btn-edit"
													onClick={() => setFormValue(product)}
													title="Editar producto"
												>
													<i className="fa-solid fa-pen-to-square"></i>
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>

						<div className="pagination-container">
						{
						totalButtons.map((btn)=>(
							<button key={btn} onClick={()=>getProducts(btn)}>
								{btn +1}

							</button>
						))
					}
						</div>
						<div>
							<select
								className="input-pagination "
								onChange={(e) => setLimit(e.target.value)}
							>
								<option value={2}>2</option>
								<option value={5}>5</option>
								<option value={10}>10</option>
							</select>
						</div>
					</section>
				</div>
			</main>
		</>
	);
}
