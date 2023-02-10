import tempfile
import subprocess
import os
from pathlib import Path
from glob import glob
from zipfile import ZipFile
from typing import List

from ..utils.enums import ModelFlavour
from bailoclient.utils.exceptions import (
    ModelFlavourNotFound,
    TemplateNotAvailable,
    DirectoryNotFound,
    MissingFilesError,
)


class Bundler:
    """Class for handling model bundling"""

    bundler_functions = {}
    model_py_templates = {}

    def bundle_model(
        self,
        output_path: str,
        model=None,
        model_binary: str = None,
        model_py: str = None,
        model_requirements: str = None,
        model_flavour: str = None,
        additional_files: List[str] = None,
    ):
        """Bundle model files into the required structure for the code.zip and binary.zip
            for uploading to BAILO.

            To save and bundle a model object, provide the model object and the model_flavour.
            Model bundling will be done using Mlflow, which you will need to have installed
            in your environment.

            To bundle a pre-saved model, you will need to provide the model_binary as a minimum.
            If you are not providing model_code you will need to provide a model_flavour so that
            the appropriate model template can be bundled with your model.

        Args:
            output_path (str): Output path for code and binary zips
            model (any, optional): Model object to save via Mlflow. Must be one of
                                    the formats supported by Mlflow.
                                    See https://www.mlflow.org/docs/latest/models.html#built-in-model-flavors
                                    Defaults to None.
            model_binary (str, optional): Path to model binary. Can be a file or directory. Defaults to None.
            model_py (str, optional): Path to model.py file. If not provided, you must provide
                                        a model flavour. Defaults to None.
            model_requirements (str, optional): Path to requirements.txt file OR path to a Python file,
                                                module or notebook from which to generate the
                                                requirements.txt. Defaults to None.
            model_flavour (str, optional): Name of the flavour of model. Supported flavours are
                                            those provided by MLflow. Defaults to None.
            additional_files (list[str], optional): List or tuple of file paths of additional dependencies
                                                    or directories of dependencies for the model.
                                                    Defaults to None.
        """

        if not os.path.exists(output_path):
            self.create_dir(output_path)

        output_path = self.format_directory_path(output_path)

        if additional_files and not isinstance(additional_files, (tuple, list)):
            raise TypeError("Expected additional_files to be a list of file paths")

        if model_flavour:
            model_flavour = model_flavour.lower()

        if model:
            return self._bundle_with_mlflow(
                model,
                output_path,
                model_flavour,
                additional_files,
                model_requirements,
                model_py,
            )

        return self._bundle_model_files(
            output_path,
            model_binary,
            model_py,
            model_requirements,
            model_flavour,
            additional_files,
        )

    def _bundle_model_files(
        self,
        output_path: str,
        model_binary: str,
        model_py: str,
        model_requirements: str,
        model_flavour: str,
        additional_files: List[str],
    ):
        if not model_binary:
            raise MissingFilesError(
                "Must provide model binary or model object and flavour"
            )

        if not model_requirements:
            raise MissingFilesError(
                "Provide either path to requirements.txt or your python file/notebook/module to generate requirements.txt"
            )

        if not model_py and model_flavour not in ModelFlavour:
            raise ModelFlavourNotFound(
                "A valid model flavour must be provided to generate the model.py file"
            )

        if not model_py:
            model_py = self.model_py_templates[model_flavour]

        return self.zip_model_files(
            model_py, model_requirements, additional_files, model_binary, output_path
        )

    def _bundle_with_mlflow(
        self,
        model,
        output_path: str,
        model_flavour: str,
        additional_files: List[str] = None,
        model_requirements: str = None,
        model_py: str = None,
    ):
        """Bundle model files via MLflow. Accepts models in 'flavors' that are supported
            by MLflow.

        Args:
            model (any): Model object in a format supported by MLflow
            output_path (str): Output path to save model files to
            model_flavour (str): Model flavour. Must be supported by MLflow
            additional_files (List[str], optional): List of additional files to include as
                                                    dependencies. Defaults to None.
            model_requirements (str, optional): Model requirements.txt file. Will be generated
                                                by MLflow if not provided. Defaults to None.
            model_py (str, optional): Path to model.py file. Will use the template for the
                                        model flavour if not provided. Defaults to None.

        Raises:
            TemplateNotAvailable: MLeap models do not have an available template
            ModelFlavourNotRecognised: The provided model flavour was not recognised
        """

        if model and model_flavour not in ModelFlavour:
            raise ModelFlavourNotFound(
                "A valid model flavour must be provided for MLflow bundling"
            )

        import mlflow

        tmpdir = tempfile.TemporaryDirectory()

        code_path = os.path.join(tmpdir.name, "code")
        binary_path = os.path.join(tmpdir.name, "binary")

        if model_flavour == "mleap" and not model_py:
            raise TemplateNotAvailable(
                "There is no model template available for MLeap models"
            )

        try:
            self.bundler_functions[model_flavour](
                model=model,
                path=output_path,
                code_paths=additional_files,
                pip_requirements=model_requirements,
            )

            if not model_py:
                model_py = self.model_py_templates[model_flavour]

        except KeyError:
            raise ModelFlavourNotFound(
                "Model flavour not recognised. Check MLflow docs for list of supported flavours"
            ) from None

        # copy model.py into tmpdir containing model files
        subprocess.run(["cp", "-r", model_py, f"{code_path}/model.py"])

        # move binary file into new folder in tmpdir
        subprocess.run(["mv", glob(f"{code_path}/data/model*")[0], binary_path])

        # create zips
        self.zip_files(binary_path, f"{output_path}/binary.zip")
        self.zip_files(code_path, f"{output_path}/code.zip")

        tmpdir.cleanup()

    def __contains_required_code_files(self, code_dir: str):
        """Check that a directory of model code contains requirements.txt and model.py files

        Args:
            code_dir (str): Path of code directory

        Returns:
            boolean: True if required files found
        """
        code_files = [
            file.lower() for _, _, files in os.walk(code_dir) for file in files
        ]
        return "requirements.txt" in code_files and "model.py" in code_files

    def zip_model_files(
        self,
        model_code: str,
        model_requirements: str,
        additional_files: str,
        model_binary: str,
        output_path: str,
    ):
        """Create code.zip and binary.zip of provoded model files at output path.
            Copies all files to a tempdir in the format expected by BAILO.

        Args:
            model_code (str): Path to model.py file
            model_requirements (str): Path of requirements.txt file
            additional_files (List[str]): List of paths of any additional required files
            model_binary (str): Path of model binary
            output_path (str): Path to create the code.zip and binary.zip files
        """
        tmpdir = tempfile.TemporaryDirectory()

        code_path = os.path.join(tmpdir.name, "code")
        binary_path = os.path.join(tmpdir.name, "binary")

        # move model files
        if model_requirements != "requirements.txt":
            self.generate_requirements_file(
                model_requirements, f"{code_path}/requirements.txt"
            )

        else:
            subprocess.run(["cp", "-r", model_requirements, code_path])

        for file_path in additional_files:
            subprocess.run(["cp", "-r", file_path, code_path])

        subprocess.run(["cp", "-r", model_code, code_path])
        subprocess.run(["cp", "-r", model_binary, binary_path])

        # create zips
        self.zip_files(binary_path, f"{output_path}/binary.zip")
        self.zip_files(code_path, f"{output_path}/code.zip")

        tmpdir.cleanup()

    def zip_files(self, file_path: str, zip_path: str):
        """Create zip file at the specified zip path from a file or folder path

        Args:
            file_path (str): The file or folder to zip
            zip_path (str): Path to create the new zip at
        """
        if os.path.isdir(file_path):
            self.__zip_directory(file_path, zip_path)

        else:
            self.__zip_file(file_path, zip_path)

    def __zip_file(self, file_path: str, zip_path: str):
        """Zip a single file into new zip created at zip_path

        Args:
            file_path (str): Path to file to zip
            zip_path (str): Output path for zip
        """
        file_name = os.path.split(file_path)[1]

        with ZipFile(zip_path, "w") as zf:
            zf.write(file_path, arcname=file_name)

    def __zip_directory(self, file_path: str, zip_path: str):
        """Zip a directory of files into new zip created at the zip_path

        Args:
            file_path (str): Path to code or binary folder
            zip_path (str): Output path for zip
        """
        with ZipFile(zip_path, "w") as zf:
            for dir_path, _, files in os.walk(file_path):
                output_dir = self.__get_output_dir(dir_path, file_path)

                for file in files:
                    zf.write(
                        filename=f"{dir_path}/{file}", arcname=f"{output_dir}{file}"
                    )

    def __get_output_dir(self, file_path: str, dir_path: str):
        """Remove top level folder to get the output dir required for the zip files

        Args:
            file_path (str): Path to code or binary folder
            dir_path (str): Directory path within code or binary folder

        Returns:
            str: Output directory with top level folder removed
        """
        if dir_path == file_path:
            return ""

        return os.path.join(Path(file_path).relative_to(dir_path)) + os.path.sep

    def generate_requirements_file(self, module_path: str, output_path: str):
        """Generate requirements.txt file based on imports within a Notebook,
            Python file, or Python project

        Args:
            module_path (str): Path to the Python file used to generate requirements.txt
            output_path (str): Output path in format output/path/requirements.txt

        Raises:
            Exception: Unable to create requirements.txt from specified file at specified location
        """

        output_dir, _ = os.path.split(output_path)
        if not os.path.exists(output_dir):
            raise DirectoryNotFound("Output directory could not be found")

        try:
            subprocess.run(
                ["pipreqsnb", module_path, "--savepath", output_path],
                stderr=subprocess.STDOUT,
            )

        except subprocess.CalledProcessError:
            raise subprocess.CalledProcessError(
                "Unable to create requirements file at the specified location"
            ) from None

    def create_dir(self, output_dir: str):
        """Run subprocess to create output directory

        Args:
            output_dir (str): Path of the output directory

        Raises:
            subprocess.SubprocessError: Unable to create the directory
        """
        try:
            subprocess.run(["mkdir", "-p", output_dir])

        except (subprocess.SubprocessError, ValueError):
            raise subprocess.SubprocessError("Unable to create directory") from None

    ## TODO check type - str or path?
    def format_directory_path(self, dir_path):
        """Format directory path to end with '/'

        Args:
            dir_path (str): Directory path

        Returns:
            str: Directory path
        """
        if not dir_path.endswith("/"):
            return dir_path + os.path.sep

        return dir_path
